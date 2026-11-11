// Sales Rep Payroll, Commission & Cash Deduction Engine

export class PayrollService {
  // Calculate monthly payout for a sales representative
  static calculateMonthlyPayroll({
    rep,
    verifiedAttendanceDays = 26,
    totalWorkingDaysInMonth = 26,
    totalCollectionsMade = 350000,
    cashInHandLiability = 8500,
    salaryAdvances = 2000
  }) {
    // 1. Basic Salary prorated for verified attendance days
    const dailyBaseRate = rep.base_salary / totalWorkingDaysInMonth;
    const earnedBasicSalary = Math.round(dailyBaseRate * verifiedAttendanceDays);

    // 2. Incentive calculated on actual collected payments (e.g. 2% of ₹3,50,000)
    const commissionPercent = rep.commission_rate || 2.0;
    const earnedCommission = Math.round((totalCollectionsMade * commissionPercent) / 100);

    // 3. Gross Earnings
    const grossEarnings = earnedBasicSalary + earnedCommission;

    // 4. Deductions: Cash collected from clients but still in rep's pocket + Advances
    const totalDeductions = cashInHandLiability + salaryAdvances;

    // 5. Net Payable
    const netPayout = Math.max(0, grossEarnings - totalDeductions);

    return {
      rep_id: rep.id,
      rep_name: rep.name,
      month: new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
      verifiedAttendanceDays,
      totalWorkingDaysInMonth,
      baseSalary: rep.base_salary,
      earnedBasicSalary,
      totalCollectionsMade,
      commissionPercent,
      earnedCommission,
      grossEarnings,
      cashInHandLiability,
      salaryAdvances,
      totalDeductions,
      netPayout
    };
  }
}
