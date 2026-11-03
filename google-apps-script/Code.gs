// PrintStar Pro Google Apps Script API
// Replace the existing doGet, doPost, syncProducts and getProducts functions with this file's
// equivalents. Keep the optional GET_PRODUCT_NAME / GET_PRICE scraper functions if you use them.
// Products sheet columns (exact order):
// id, code, name, price, link, salePrice, campaignName, isGiftPromo, giftName, specs, warranty

const PRINTSTAR_PRODUCT_SHEET = "Products";
const PRINTSTAR_HISTORY_SHEET = "History";
const PRINTSTAR_BACKUP_PREFIX = "Products_Backup_";
const PRINTSTAR_HEADERS = [
  "id", "code", "name", "price", "link", "salePrice",
  "campaignName", "isGiftPromo", "giftName", "specs", "warranty"
];
const PRINTSTAR_MIN_RETAIN_RATIO = 0.75;

function doPost(e) {
  try {
    var payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    var action = payload.action;
    var result;
    if (action === "syncProducts") {
      result = syncProducts(payload);
    } else if (action === "addHistory") {
      result = addHistory(payload);
    } else if (action === "clearHistory") {
      result = clearHistory();
    } else {
      result = { success: false, error: "Unknown action" };
    }
    return printstarJson_(result);
  } catch (error) {
    return printstarJson_({ success: false, error: String(error && error.message || error) });
  }
}

function doGet(e) {
  try {
    var action = e && e.parameter ? e.parameter.action : "";
    if (action === "getProducts") return printstarJson_(getProducts());
    if (action === "getHistory") return printstarJson_(getHistory());
    return printstarJson_({ success: false, error: "Unknown action" });
  } catch (error) {
    return printstarJson_({ success: false, error: String(error && error.message || error) });
  }
}

function printstarJson_(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function printstarGetProductsSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(PRINTSTAR_PRODUCT_SHEET);
  if (!sheet) return null;
  if (sheet.getLastRow() < 1 || sheet.getLastColumn() < 1) {
    throw new Error('Sheet Products không có hàng tiêu đề. Hãy tạo đúng các cột: ' + PRINTSTAR_HEADERS.join(', '));
  }
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]
    .map(function (h) { return String(h || "").trim(); });
  var missing = PRINTSTAR_HEADERS.filter(function (h) { return headers.indexOf(h) < 0; });
  if (missing.length) {
    throw new Error('Sheet Products thiếu cột bắt buộc: ' + missing.join(', ') + '. Không ghi dữ liệu để tránh làm sai cột.');
  }
  return { sheet: sheet, headers: headers };
}

function printstarParseSpecs_(value, code) {
  if (value === "" || value === null || value === undefined) return [];
  var parsed = value;
  if (typeof value === "string") {
    try { parsed = JSON.parse(value); }
    catch (error) { throw new Error('Sản phẩm ' + code + ': specs không phải JSON hợp lệ.'); }
  }
  if (!Array.isArray(parsed)) throw new Error('Sản phẩm ' + code + ': specs phải là một danh sách JSON.');
  parsed.forEach(function (spec, index) {
    if (!spec || typeof spec !== "object" || Array.isArray(spec) ||
        typeof spec.label !== "string" || typeof spec.value !== "string") {
      throw new Error('Sản phẩm ' + code + ': thông số ' + (index + 1) + ' phải có label/value dạng chuỗi.');
    }
  });
  return parsed;
}

function printstarReadProductRows_(info) {
  if (!info || info.sheet.getLastRow() < 2) return [];
  var sheet = info.sheet;
  var headers = info.headers;
  var values = sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).getValues();
  var column = {};
  headers.forEach(function (header, index) { column[header] = index; });
  var products = [];
  values.forEach(function (row, index) {
    var code = String(row[column.code] == null ? "" : row[column.code]).trim();
    // Ignore blank trailing/formatted rows, but never treat a non-empty row with no code as a product.
    if (!code) {
      var hasOtherValue = row.some(function (cell) { return cell !== "" && cell !== null; });
      if (hasOtherValue) throw new Error('Products dòng ' + (index + 2) + ' có dữ liệu nhưng thiếu code.');
      return;
    }
    var rawSpecs = row[column.specs];
    products.push({
      id: String(row[column.id] == null ? "" : row[column.id]).trim(),
      code: code,
      name: String(row[column.name] == null ? "" : row[column.name]).trim(),
      price: row[column.price] === "" ? 0 : Number(row[column.price]),
      link: String(row[column.link] == null ? "" : row[column.link]).trim(),
      salePrice: row[column.salePrice] === "" ? 0 : Number(row[column.salePrice]),
      campaignName: String(row[column.campaignName] == null ? "" : row[column.campaignName]),
      isGiftPromo: row[column.isGiftPromo] === true || String(row[column.isGiftPromo]).toLowerCase() === "true",
      giftName: String(row[column.giftName] == null ? "" : row[column.giftName]),
      specs: printstarParseSpecs_(rawSpecs, code),
      warranty: String(row[column.warranty] == null ? "" : row[column.warranty])
    });
  });
  return products;
}

function getProducts() {
  var info = printstarGetProductsSheet_();
  if (!info) return [];
  return printstarReadProductRows_(info);
}

function printstarPrice_(value, field, code) {
  if (value === "" || value === null || value === undefined) return 0;
  var number = Number(value);
  if (!isFinite(number) || number < 0) {
    throw new Error('Sản phẩm ' + code + ': ' + field + ' phải là số không âm.');
  }
  return number;
}

function printstarNormalizeIncoming_(input, existingProducts) {
  if (!Array.isArray(input) || input.length === 0) {
    throw new Error('Đã chặn đồng bộ: danh sách products rỗng hoặc không hợp lệ.');
  }

  var oldByCode = {};
  existingProducts.forEach(function (p) {
    var key = p.code.toLowerCase();
    if (oldByCode[key]) throw new Error('Sheet đang có code bị trùng: ' + p.code + '. Hãy xử lý trùng trước khi đồng bộ.');
    oldByCode[key] = p;
  });

  var seenCodes = {};
  var seenIds = {};
  var products = input.map(function (raw, index) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
      throw new Error('Dòng gửi lên ' + (index + 1) + ' không phải object sản phẩm.');
    }
    var code = String(raw.code == null ? "" : raw.code).trim();
    if (!code) throw new Error('Dòng gửi lên ' + (index + 1) + ' thiếu code.');
    var key = code.toLowerCase();
    if (seenCodes[key]) throw new Error('Code bị trùng trong dữ liệu gửi lên: ' + code + '.');
    seenCodes[key] = true;

    var name = String(raw.name == null ? "" : raw.name).trim();
    if (!name) throw new Error('Sản phẩm ' + code + ' thiếu name.');
    var price = printstarPrice_(raw.price, 'price', code);
    var salePrice = printstarPrice_(raw.salePrice, 'salePrice', code);
    var link = String(raw.link == null ? "" : raw.link).trim();
    if (link) {
      if (!/^https?:\/\//i.test(link)) throw new Error('Sản phẩm ' + code + ': link phải bắt đầu bằng http:// hoặc https://.');
      try { new URL(link); } catch (error) { throw new Error('Sản phẩm ' + code + ': link không hợp lệ.'); }
    }
    var old = oldByCode[key];
    // The existing Sheet id is authoritative for a matching code. New rows get an app-generated UUID.
    var id = old && old.id ? old.id : String(raw.id == null ? "" : raw.id).trim();
    if (!id) id = Utilities.getUuid();
    if (seenIds[id]) throw new Error('id bị trùng trong dữ liệu gửi lên: ' + id + '.');
    seenIds[id] = true;
    var isGiftPromo = raw.isGiftPromo === true || String(raw.isGiftPromo).toLowerCase() === "true" || raw.isGiftPromo === 1;

    return {
      id: id,
      code: code,
      name: name,
      price: price,
      link: link,
      salePrice: salePrice,
      campaignName: String(raw.campaignName == null ? "" : raw.campaignName),
      isGiftPromo: isGiftPromo,
      giftName: String(raw.giftName == null ? "" : raw.giftName),
      specs: JSON.stringify(printstarParseSpecs_(raw.specs, code)),
      warranty: String(raw.warranty == null ? "" : raw.warranty)
    };
  });
  return products;
}

function printstarBackupBeforeWrite_(sheet) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stamp = Utilities.formatDate(new Date(), ss.getSpreadsheetTimeZone(), "yyyyMMdd_HHmmss");
  var name = (PRINTSTAR_BACKUP_PREFIX + stamp).slice(0, 99);
  if (ss.getSheetByName(name)) name = (name + "_" + Utilities.getUuid().slice(0, 6)).slice(0, 99);
  // Abort before touching Products if a recoverable snapshot cannot be created.
  var copy = sheet.copyTo(ss);
  copy.setName(name);
  return name;
}

function syncProducts(payload) {
  var lock = LockService.getDocumentLock();
  lock.waitLock(30000);
  try {
    var info = printstarGetProductsSheet_();
    if (!info) throw new Error('Không tìm thấy sheet Products. Tạo sheet và hàng tiêu đề trước; không đồng bộ vào kho rỗng.');

    var current = printstarReadProductRows_(info);
    if (current.length === 0) {
      throw new Error('Đã chặn đồng bộ: Sheet Products hiện không có sản phẩm. Khôi phục/kiểm tra dữ liệu Sheet trước khi ghi.');
    }

    var input = payload && payload.products;
    if (!Array.isArray(input) || input.length === 0) {
      throw new Error('Đã chặn đồng bộ: danh sách products rỗng. Sheet chưa bị thay đổi.');
    }
    var minAllowed = Math.max(1, Math.ceil(current.length * PRINTSTAR_MIN_RETAIN_RATIO));
    if (input.length < minAllowed) {
      throw new Error('Đã chặn đồng bộ: payload có ' + input.length + ' sản phẩm, thấp hơn ngưỡng ' + minAllowed + ' (Sheet có ' + current.length + '). Sheet chưa bị thay đổi.');
    }

    var products = printstarNormalizeIncoming_(input, current);
    // Canonical schema and order. The original sheet is retained as a separate backup tab.
    var backupName = printstarBackupBeforeWrite_(info.sheet);
    var sheet = info.sheet;
    var oldRows = Math.max(0, sheet.getLastRow() - 1);
    if (oldRows > 0) sheet.getRange(2, 1, oldRows, Math.max(sheet.getLastColumn(), PRINTSTAR_HEADERS.length)).clearContent();
    sheet.getRange(1, 1, 1, PRINTSTAR_HEADERS.length).setValues([PRINTSTAR_HEADERS]);

    var rows = products.map(function (p) {
      return PRINTSTAR_HEADERS.map(function (header) {
        return header === "specs" ? p.specs : p[header];
      });
    });
    if (rows.length) {
      var requiredLastRow = rows.length + 1;
      if (sheet.getMaxRows() < requiredLastRow) sheet.insertRowsAfter(sheet.getMaxRows(), requiredLastRow - sheet.getMaxRows());
      sheet.getRange(2, 1, rows.length, PRINTSTAR_HEADERS.length).setValues(rows);
    }
    SpreadsheetApp.flush();
    return {
      success: true,
      count: products.length,
      backupSheet: backupName,
      columns: PRINTSTAR_HEADERS,
      message: 'Đã đồng bộ dữ liệu theo schema PrintStar Pro.'
    };
  } finally {
    lock.releaseLock();
  }
}

// Print history actions are retained for compatibility with the current app API.
function getHistory() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRINTSTAR_HISTORY_SHEET);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var values = sheet.getDataRange().getValues();
  var headers = values[0].map(function (h) { return String(h || "").trim(); });
  return values.slice(1).filter(function (row) { return row.some(function (v) { return v !== "" && v !== null; }); })
    .map(function (row) {
      var record = {};
      headers.forEach(function (header, i) {
        var value = row[i];
        if (header === "items" && value) {
          try { value = JSON.parse(value); } catch (error) { value = []; }
        }
        record[header] = value;
      });
      return record;
    });
}

function addHistory(payload) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRINTSTAR_HISTORY_SHEET);
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(PRINTSTAR_HISTORY_SHEET);
    sheet.getRange(1, 1, 1, 3).setValues([["id", "timestamp", "items"]]);
  }
  var record = payload && payload.record;
  if (!record || !record.id || !record.timestamp) throw new Error("History record cần có id và timestamp.");
  var items = typeof record.items === "object" ? JSON.stringify(record.items) : String(record.items || "");
  sheet.appendRow([record.id, record.timestamp, items]);
  return { success: true };
}

function clearHistory() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PRINTSTAR_HISTORY_SHEET);
  if (sheet && sheet.getLastRow() > 1) sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  return { success: true };
}
