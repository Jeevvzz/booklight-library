export function validateInventory(totalCopies: number, availableCopies: number) {
  if (!Number.isInteger(totalCopies) || totalCopies < 1) throw new Error("Total copies must be at least 1");
  if (!Number.isInteger(availableCopies) || availableCopies < 0) throw new Error("Available copies cannot be negative");
  if (availableCopies > totalCopies) throw new Error("Available copies cannot exceed total copies");
  return true;
}

export function getDueDate(borrowDate: Date, loanDays = 14) {
  return new Date(borrowDate.getTime() + loanDays * 86400000);
}

export function calculateFineAmount(dueDate: Date, returnDate: Date, centsPerDay = 100) {
  const overdueDays = Math.max(0, Math.ceil((returnDate.getTime() - dueDate.getTime()) / 86400000));
  return { overdueDays, fineAmount: overdueDays * centsPerDay };
}

export function predictFinishDate(now: Date, pagesRead: number, totalPages: number, pagesPerDay: number) {
  if (totalPages <= 0 || pagesPerDay <= 0) return new Date(now);
  const remainingPages = Math.max(0, totalPages - pagesRead);
  return new Date(now.getTime() + Math.ceil(remainingPages / pagesPerDay) * 86400000);
}
