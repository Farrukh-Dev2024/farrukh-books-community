// import { Prisma } from "@/generated/prisma/client";

// // Recursively convert Prisma.Decimal -> number
// export type DecimalToNumber<T> =
//   T extends Prisma.Decimal ? number :
//   T extends (infer U)[] ? DecimalToNumber<U>[] :
//   T extends Date ? Date :                    // <-- Don't convert dates
//   T extends object ? { [K in keyof T]: DecimalToNumber<T[K]> } :
//   T;

// export function convertDecimals<T>(obj: T): DecimalToNumber<T> {
//   if (obj === null || obj === undefined) {
//     return obj as DecimalToNumber<T>;
//   }

//   // Convert Prisma.Decimal → number
//   if (obj instanceof Prisma.Decimal) {
//     return obj.toNumber() as DecimalToNumber<T>;
//   }

//   // 🔒 STOP: If value is a Date, return it as-is
//   if (obj instanceof Date) {
//     return obj as DecimalToNumber<T>;
//   }

//   // Arrays
//   if (Array.isArray(obj)) {
//     return obj.map((item) => convertDecimals(item)) as DecimalToNumber<T>;
//   }

//   // Objects
//   if (typeof obj === "object") {
//     const result: any = {};
//     for (const key in obj) {
//       result[key] = convertDecimals((obj as any)[key]);
//     }
//     return result as DecimalToNumber<T>;
//   }

//   // Primitives
//   return obj as DecimalToNumber<T>;
// }
