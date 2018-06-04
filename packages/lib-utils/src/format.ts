export const removeExtraZeros = (n: string) => {
  if (n.includes('.')) {
    const [integer, decimals] = n.split('.');

    let maxLen = decimals.length;
    while (maxLen > 0 && decimals[maxLen - 1] === '0') {
      maxLen--;
    }

    return maxLen === 0 ? integer : `${integer}.${decimals.substring(0, maxLen)}`;
  } else {
    return n;
  }
};

export const fixDecimals = (n: string, decimalsQty: number) => {
  if (n.includes('.')) {
    const [integer, decimals] = n.split('.');
    return decimalsQty > 0 ? `${integer}.${decimals.substring(0, decimalsQty)}` : integer;
  } else {
    return n;
  }
};
