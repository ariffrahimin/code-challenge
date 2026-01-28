## Overview

This document outlines the computational inefficiencies and anti-patterns found in the WalletPage component implementation.

---

## 🔴 Computational Inefficiencies

### 1. Redundant `getPriority` Calls

**Issue:** Each balance has `getPriority` called multiple times unnecessarily.

```typescript
// Called 3 times for the same balance during filter + sort
const balancePriority = getPriority(balance.blockchain); // filter
const leftPriority = getPriority(lhs.blockchain); // sort
const rightPriority = getPriority(rhs.blockchain); // sort
```

**Impact:** O(n×3) instead of O(n)

**Solution:** Cache priority values or restructure to call once per item.

---

### 2. Inefficient Switch Statement

**Issue:** Switch statement performs sequential case checking.

```typescript
const getPriority = (blockchain: any): number => {
  switch (
    blockchain // O(n) lookup in worst case
  ) {
    case "Osmosis":
      return 100;
    case "Ethereum":
      return 50;
    // ...
  }
};
```

**Impact:** O(n) lookup vs O(1)

**Solution:** Use object or Map for constant-time lookups.

```typescript
const BLOCKCHAIN_PRIORITY: Record<string, number> = {
  Osmosis: 100,
  Ethereum: 50,
  Arbitrum: 30,
  Zilliqa: 20,
  Neo: 20,
};

const getPriority = (blockchain: string): number => {
  return BLOCKCHAIN_PRIORITY[blockchain] ?? -99;
};
```

---

### 3. Creating Unused Data Structure

**Issue:** Memory and CPU wasted on unused array transformation.

```typescript
const formattedBalances = sortedBalances.map(...) // Never used!
```

**Impact:** Unnecessary O(n) operation and memory allocation.

**Solution:** Remove entirely.

---

### 4. Double Iteration Over sortedBalances

**Issue:** Iterating over the same array twice.

```typescript
const formattedBalances = sortedBalances.map(...) // First iteration
const rows = sortedBalances.map(...)              // Second iteration
```

**Impact:** O(2n) instead of O(n)

**Solution:** Combine operations into single pass.

---

### 5. Missing Memoization for Rows

**Issue:** Rows recreated on every render regardless of data changes.

```typescript
const rows = sortedBalances.map(...) // Recalculates on every render
```

**Impact:** Unnecessary re-computation and React reconciliation.

**Solution:** Wrap in `useMemo`.

```typescript
const rows = useMemo(() => {
  return sortedBalances.map(...);
}, [sortedBalances, prices]);
```

---

### 6. Incorrect Dependency Array

**Issue:** Includes `prices` in dependencies but doesn't use it in computation.

```typescript
useMemo(() => { ... }, [balances, prices]);
//                              ^^^^^^ not used in filter/sort
```

**Impact:** Unnecessary recalculations when prices change.

**Solution:** Remove `prices` from first `useMemo` dependency array.

---

### 7. Verbose Sort Comparator

**Issue:** Overly verbose comparison logic.

```typescript
if (leftPriority > rightPriority) {
  return -1;
} else if (rightPriority > leftPriority) {
  return 1;
}
// Missing return 0
```

**Impact:** More code to execute, missing edge case.

**Solution:** Simplify to arithmetic comparison.

```typescript
return getPriority(rhs.blockchain) - getPriority(lhs.blockchain);
```

---

## ⚠️ Anti-patterns

### 8. Using `any` Type

**Issue:** Defeats TypeScript's type safety.

```typescript
const getPriority = (blockchain: any): number => {
```

**Solution:** Use proper type `string`.

---

### 9. Array Index as React Key

**Issue:** Classic React anti-pattern causing rendering issues.

```typescript
<WalletRow key={index} />
```

**Problems:**

- Breaks component state preservation
- Causes unnecessary re-renders
- Leads to bugs when list order changes

**Solution:** Use unique identifier.

```typescript
<WalletRow key={balance.currency} />
// Or better: key={balance.id} if available
```

---

### 10. Defining Function Inside Component

**Issue:** Function recreated on every render.

```typescript
const WalletPage: React.FC<Props> = (props: Props) => {
  const getPriority = (blockchain: any): number => { ... }
```

**Impact:** Unnecessary function creation on each render.

**Solution:** Move outside component or use `useCallback`.

```typescript
// Outside component
const getPriority = (blockchain: string): number => { ... };

const WalletPage: React.FC<Props> = (props) => {
  // ...
};
```

---

### 11. Redundant Type Annotation

**Issue:** Duplicate type specification.

```typescript
const WalletPage: React.FC<Props> = (props: Props) => {
  //                                        ^^^^^^ redundant
```

**Solution:** TypeScript infers this automatically.

```typescript
const WalletPage: React.FC<Props> = (props) => {
```

---

### 12. Missing Interface Properties

**Issue:** Interface doesn't reflect actual usage.

```typescript
interface WalletBalance {
  currency: string;
  amount: number;
  // blockchain is missing but used throughout!
}
```

**Solution:** Add missing property.

```typescript
interface WalletBalance {
  currency: string;
  amount: number;
  blockchain: string;
}
```

---

### 13. Inverted Filter Logic

**Issue:** Keeps invalid data, filters out valid data.

```typescript
if (lhsPriority > -99) {
  if (balance.amount <= 0) {
    return true; // Keeps zero/negative amounts!
  }
}
return false;
```

**Solution:** Fix logic to keep positive balances.

```typescript
const priority = getPriority(balance.blockchain);
return priority > -99 && balance.amount > 0;
```

---

### 14. Inconsistent Variable Naming

**Issue:** Mixed naming conventions reduce readability.

```typescript
// In filter: balancePriority, lhsPriority (undefined!)
// In sort: leftPriority, rightPriority
```

**Solution:** Use consistent naming throughout.

---

### 15. Magic Numbers

**Issue:** Unexplained literal values reduce code clarity.

```typescript
if (lhsPriority > -99)
  // What does -99 mean?
  return -99;
```

**Solution:** Use named constants.

```typescript
const UNKNOWN_PRIORITY = -99;

if (priority > UNKNOWN_PRIORITY) { ... }
```

---

### 16. Unnecessary Destructuring

**Issue:** Destructured variable never used.

```typescript
const { children, ...rest } = props;
// 'children' is never used
```

**Solution:** Remove unused destructuring.

```typescript
const { ...rest } = props;
// Or just use props directly
```

---

### 17. Wrong Type Assertion in Map

**Issue:** Type mismatch between actual and declared types.

```typescript
sortedBalances.map((balance: FormattedWalletBalance, ...) => {
  // sortedBalances is WalletBalance[], not FormattedWalletBalance[]
```

**Solution:** Use correct type or transform data appropriately.

---

## 🐛 Critical Bugs

### Undefined Variable

```typescript
if (lhsPriority > -99) { // lhsPriority is never defined!
```

Should be `balancePriority`.

### Missing Return Value in Sort

The sort function doesn't return `0` when priorities are equal, causing inconsistent sorting behavior.

---

## 📊 Performance Impact Summary

### High Impact Issues

1. **Double iteration** (#3, #4): O(2n) → O(n)
2. **Multiple getPriority calls** (#1): O(n×3) → O(n)
3. **Missing memoization** (#5): Causes unnecessary re-renders
4. **Index keys** (#9): Can cause full list re-renders

### Compound Effect

These issues compound in large lists (1000+ items), potentially causing:

- Slow initial renders
- Laggy interactions
- Poor perceived performance
- Unnecessary memory consumption

---

### Key Improvements

- ✅ Single iteration pattern
- ✅ Proper memoization strategy
- ✅ Type safety throughout
- ✅ Constant-time lookups
- ✅ Correct React keys
- ✅ Fixed filter logic
- ✅ Removed dead code

---
