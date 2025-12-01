class HistoryStack:
    def __init__(self):
        self.stack = []

    def push(self, word):
        self.stack.append(word)

    def pop(self):
        return self.stack.pop() if self.stack else None

    def all(self):
        return self.stack
