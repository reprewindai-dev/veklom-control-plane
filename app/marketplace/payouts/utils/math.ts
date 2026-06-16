// @ts-nocheck
"use client";
/**
 * High-Precision Currency Mathematics simulating Postgres numeric(18,6)
 * Scaled factor is 1,000,000 (6 decimal places)
 */

export class PreciseDecimal {
  private value: bigint; // internal scaled integer

  constructor(val: string | number | bigint) {
    if (typeof val === "bigint") {
      this.value = val;
    } else if (typeof val === "number") {
      // Beware of float conversion before entry - strictly handle string conversion if possible
      this.value = BigInt(Math.round(val * 1000000));
    } else {
      // Parse string representation
      const trimmed = val.trim();
      const parts = trimmed.split(".");
      let integerPart = parts[0] || "0";
      let decimalPart = parts[1] || "";
      
      // Pad decimal to 6 digits
      decimalPart = decimalPart.slice(0, 6).padEnd(6, "0");
      
      // Determine sign
      const negative = integerPart.startsWith("-");
      if (negative) {
        integerPart = integerPart.replace("-", "");
      }
      
      const unscaled = BigInt(integerPart) * 1000000n + BigInt(decimalPart);
      this.value = negative ? -unscaled : unscaled;
    }
  }

  static fromUnscaled(bigIntValue: bigint): PreciseDecimal {
    return new PreciseDecimal(bigIntValue);
  }

  add(other: PreciseDecimal): PreciseDecimal {
    return new PreciseDecimal(this.value + other.value);
  }

  subtract(other: PreciseDecimal): PreciseDecimal {
    return new PreciseDecimal(this.value - other.value);
  }

  getBigIntValue(): bigint {
    return this.value;
  }

  // Check if float value has drift
  static demonstrateFloatDrift(count: number, increment: number): { floatResult: number; exactResult: string; driftAmount: number } {
    let floatSum = 0;
    let exactSum = new PreciseDecimal("0.000000");
    const incStr = increment.toFixed(6);
    const incDecimal = new PreciseDecimal(incStr);

    for (let i = 0; i < count; i++) {
      floatSum += increment;
      exactSum = exactSum.add(incDecimal);
    }

    const exactFloat = parseFloat(exactSum.toString());
    return {
      floatResult: floatSum,
      exactResult: exactSum.toString(),
      driftAmount: Math.abs(floatSum - exactFloat)
    };
  }

  toString(): string {
    const isNegative = this.value < 0n;
    const absVal = isNegative ? -this.value : this.value;
    const integerPart = absVal / 1000000n;
    const decimalPart = (absVal % 1000000n).toString().padStart(6, "0");
    return `${isNegative ? "-" : ""}${integerPart}.${decimalPart}`;
  }

  toDouble(): number {
    return parseFloat(this.toString());
  }

  isLessThan(other: PreciseDecimal): boolean {
    return this.value < other.value;
  }

  isGreaterThan(other: PreciseDecimal): boolean {
    return this.value > other.value;
  }

  isZero(): boolean {
    return this.value === 0n;
  }
}

