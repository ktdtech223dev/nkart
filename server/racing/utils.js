function v4() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}
module.exports = { v4 };
