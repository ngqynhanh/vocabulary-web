from ds.circular_linked_list import CircularLinkedList

class FlashcardService:
    def __init__(self):
        self.cards = CircularLinkedList()
        self.cards.add("apple")
        self.cards.add("banana")
        self.cards.add("computer")

    def next(self):
        return self.cards.next()
