class Node:
    def __init__(self, value):
        self.value = value
        self.next = None


class CircularLinkedList:
    def __init__(self):
        self.head = None

    def add(self, value):
        node = Node(value)
        if not self.head:
            self.head = node
            node.next = self.head
            return
        cur = self.head
        while cur.next != self.head:
            cur = cur.next
        cur.next = node
        node.next = self.head

    def next(self):
        if not self.head:
            return None
        value = self.head.value
        self.head = self.head.next
        return value
