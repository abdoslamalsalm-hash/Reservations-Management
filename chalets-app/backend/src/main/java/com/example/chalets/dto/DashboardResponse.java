package com.example.chalets.dto;

import java.math.BigDecimal;
import java.util.List;

/**
 * ردّ الصفحة الرئيسية: ملخص الشاليهات الستة + الإجمالي العام.
 */
public record DashboardResponse(
        List<ChaletSummary> chalets,
        BigDecimal grandTotal,
        long totalBookings
) {
}
