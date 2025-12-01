from ds.history_stack import HistoryStack

class HistoryService:
    def __init__(self):
        self.stack = HistoryStack()

    def add(self, word):
        self.stack.push(word)

    def undo(self):
        return self.stack.pop()

    def all(self):
        return self.stack.all()
