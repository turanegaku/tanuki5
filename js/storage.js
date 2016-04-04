function LocalStorageManager() {
  this.storage = {};
}

LocalStorageManager.prototype.open = function(title) {
  this.storage[title] = JSON.parse(localStorage.getItem(title)) || {};
};

LocalStorageManager.prototype.close = function(title) {
  localStorage.setItem(title, JSON.stringify(this.storage[title]));
};

// Best score getters/setters
LocalStorageManager.prototype.getValue = function(title, key) {
  return this.storage[title][key];
};

LocalStorageManager.prototype.setValue = function(title, key, value) {
  this.storage[title][key] = value;
};
