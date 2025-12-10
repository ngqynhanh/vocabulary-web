package com.example.smartdictionary;

import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for TranslateService guard rails (no network dependency).
 */
class TranslateServiceTest {

    private TranslateService translateService;

    @BeforeEach
    void setUp() {
        translateService = new TranslateService();
    }

    @Test
    void translateEnToVi_returnsNull_onNullInput() {
        assertNull(translateService.translateEnToVi(null));
    }

    @Test
    void translateEnToVi_returnsNull_onBlankInput() {
        assertNull(translateService.translateEnToVi(""));
    }
}
