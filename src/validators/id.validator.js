// Zet alleen volledig numerieke routeparameters om naar veilige positieve IDs.
function parsePositiveInteger(value) {
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);
  return Number.isSafeInteger(parsedValue) && parsedValue > 0 ? parsedValue : null;
}

module.exports = {
  parsePositiveInteger,
};
