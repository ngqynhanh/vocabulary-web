package com.example.smartdictionary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class FlashcardListTest {

    @Test
    void addAndIterateCircularly() {
        FlashcardList list = new FlashcardList();
        list.add("apple", "A fruit");
        list.add("banana", "Yellow fruit");

        FlashcardList.CardNode first = list.getCurrent();
        assertNotNull(first);
        assertEquals("apple", first.word);

        // getNext returns current, then advances
        FlashcardList.CardNode next = list.getNext();
        assertEquals("apple", next.word);

        FlashcardList.CardNode second = list.getNext();
        assertEquals("banana", second.word);

        FlashcardList.CardNode loop = list.getNext();
        assertEquals("apple", loop.word); // loops back to start
    }

    @Test
    void reviewCurrent_pushesNotRemembered() {
        FlashcardList list = new FlashcardList();
        list.add("apple", "A fruit");
        list.add("banana", "Yellow fruit");
        NotRememberedStack stack = new NotRememberedStack();

        // Mark first as not remembered
        list.reviewCurrent(false, stack);
        assertFalse(stack.isEmpty());
        assertEquals("apple", stack.getPending().get(0));

        // Current should advance to next card
        FlashcardList.CardNode current = list.getCurrent();
        assertEquals("banana", current.word);

        // Mark remembered should not add
        list.reviewCurrent(true, stack);
        assertEquals(1, stack.getPending().size());
    }
}
