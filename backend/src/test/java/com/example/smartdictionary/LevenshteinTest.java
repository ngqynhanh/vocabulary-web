package com.example.smartdictionary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.Set;

import org.junit.jupiter.api.Test;

class LevenshteinTest {

    @Test
    void calculate_returnsZeroForIdenticalStrings() {
        assertEquals(0, Levenshtein.calculate("apple", "apple"));
    }

    @Test
    void calculate_handlesInsertionDeletionAndSubstitution() {
        assertEquals(1, Levenshtein.calculate("apple", "apples")); // insertion
        assertEquals(1, Levenshtein.calculate("apples", "apple")); // deletion
        assertEquals(1, Levenshtein.calculate("apple", "appla")); // substitution
    }

    @Test
    void findClosest_returnsExactMatchWhenPresent() {
        Set<String> dict = Set.of("apple", "banana", "carrot");
        assertEquals("apple", Levenshtein.findClosest("apple", dict));
    }

    @Test
    void findClosest_returnsNearestWithinThreshold() {
        Set<String> dict = Set.of("apple", "banana", "carrot");
        // "appl" distance 1 from apple
        assertEquals("apple", Levenshtein.findClosest("appl", dict));
    }

    @Test
    void findClosest_returnsNullWhenTooFar() {
        Set<String> dict = Set.of("apple", "banana", "carrot");
        // distance from "zebra" to each is > 2, threshold should return null
        assertNull(Levenshtein.findClosest("zebra", dict));
    }
}
