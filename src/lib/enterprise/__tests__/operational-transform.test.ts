// Unit Tests for Operational Transform Algorithm
import { OperationalTransform, Operation } from '../collaboration'

describe('Operational Transform Algorithm', () => {
  describe('Operation Application', () => {
    test('should apply insert operation correctly', () => {
      const content = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: ' Beautiful',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello Beautiful World')
    })

    test('should apply delete operation correctly', () => {
      const content = 'Hello Beautiful World'
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 10, // ' Beautiful'
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello World')
    })

    test('should handle insert at beginning', () => {
      const content = 'World'
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 0,
        content: 'Hello ',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello World')
    })

    test('should handle insert at end', () => {
      const content = 'Hello'
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: ' World',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello World')
    })

    test('should handle delete at beginning', () => {
      const content = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 0,
        length: 6, // 'Hello '
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('World')
    })

    test('should handle delete at end', () => {
      const content = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 6, // ' World'
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello')
    })

    test('should handle retain operation', () => {
      const content = 'Hello World'
      const operation: Operation = {
        id: 'op1',
        type: 'retain',
        position: 5,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result).toBe('Hello World') // No change
    })
  })

  describe('Operation Transformation', () => {
    test('should transform two insert operations correctly', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 5,
        content: 'B',
        userId: 'user2',
        timestamp: new Date(),
        version: 1
      }

      const [transformed1, transformed2] = OperationalTransform.transform(op1, op2)

      // op1 should remain at position 5, op2 should move to position 6
      expect(transformed1.position).toBe(5)
      expect(transformed2.position).toBe(6)
      expect(transformed1.content).toBe('A')
      expect(transformed2.content).toBe('B')
    })

    test('should transform insert and delete operations', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'ABC',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 3,
        userId: 'user2',
        timestamp: new Date(),
        version: 1
      }

      const [transformedInsert, transformedDelete] = OperationalTransform.transform(insertOp, deleteOp)

      // Insert should remain at position 5
      expect(transformedInsert.position).toBe(5)
      expect(transformedInsert.content).toBe('ABC')

      // Delete should move to position 13 (10 + 3 characters inserted)
      expect(transformedDelete.position).toBe(13)
      expect(transformedDelete.length).toBe(3)
    })

    test('should transform two delete operations', () => {
      const delete1: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 3,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const delete2: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 2,
        userId: 'user2',
        timestamp: new Date(),
        version: 1
      }

      const [transformed1, transformed2] = OperationalTransform.transform(delete1, delete2)

      // First delete should remain at position 5
      expect(transformed1.position).toBe(5)
      expect(transformed1.length).toBe(3)

      // Second delete should move to position 7 (10 - 3 characters deleted)
      expect(transformed2.position).toBe(7)
      expect(transformed2.length).toBe(2)
    })

    test('should handle overlapping delete operations', () => {
      const delete1: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 10,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const delete2: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 10,
        userId: 'user2',
        timestamp: new Date(),
        version: 1
      }

      const [transformed1, transformed2] = OperationalTransform.transform(delete1, delete2)

      // Operations should be merged/adjusted for overlap
      expect(transformed1.position).toBe(5)
      expect(transformed2.position).toBe(5)
      expect(transformed2.length).toBe(0) // Nullified due to overlap
    })
  })

  describe('Operation Composition', () => {
    test('should compose sequential insert operations', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 6,
        content: 'B',
        userId: 'user1',
        timestamp: new Date(),
        version: 2
      }

      const composed = OperationalTransform.compose([op1, op2])

      // Should merge into single operation
      expect(composed).toHaveLength(1)
      expect(composed[0].content).toBe('AB')
      expect(composed[0].position).toBe(5)
    })

    test('should not compose operations from different users', () => {
      const op1: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const op2: Operation = {
        id: 'op2',
        type: 'insert',
        position: 6,
        content: 'B',
        userId: 'user2',
        timestamp: new Date(),
        version: 2
      }

      const composed = OperationalTransform.compose([op1, op2])

      // Should remain as separate operations
      expect(composed).toHaveLength(2)
      expect(composed[0].userId).toBe('user1')
      expect(composed[1].userId).toBe('user2')
    })

    test('should handle empty operation list', () => {
      const composed = OperationalTransform.compose([])
      expect(composed).toHaveLength(0)
    })

    test('should handle single operation', () => {
      const op: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const composed = OperationalTransform.compose([op])
      expect(composed).toHaveLength(1)
      expect(composed[0]).toEqual(op)
    })
  })

  describe('Edge Cases', () => {
    test('should handle empty content', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 0,
        content: 'Hello',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation('', operation)
      expect(result).toBe('Hello')
    })

    test('should handle empty insert content', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: '',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation('Hello World', operation)
      expect(result).toBe('Hello World') // No change
    })

    test('should handle zero-length delete', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 5,
        length: 0,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation('Hello World', operation)
      expect(result).toBe('Hello World') // No change
    })

    test('should handle position beyond content length', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 100,
        content: 'End',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation('Hello', operation)
      expect(result).toBe('HelloEnd') // Should append at end
    })

    test('should handle delete beyond content length', () => {
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 3,
        length: 100,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation('Hello', operation)
      expect(result).toBe('Hel') // Should delete to end
    })
  })

  describe('Consistency Properties', () => {
    test('should maintain content length consistency for inserts', () => {
      const content = 'Hello World'
      const insertText = 'Beautiful '
      
      const operation: Operation = {
        id: 'op1',
        type: 'insert',
        position: 6,
        content: insertText,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result.length).toBe(content.length + insertText.length)
    })

    test('should maintain content length consistency for deletes', () => {
      const content = 'Hello Beautiful World'
      const deleteLength = 10
      
      const operation: Operation = {
        id: 'op1',
        type: 'delete',
        position: 6,
        length: deleteLength,
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const result = OperationalTransform.applyOperation(content, operation)
      expect(result.length).toBe(content.length - deleteLength)
    })

    test('should preserve operation types during transformation', () => {
      const insertOp: Operation = {
        id: 'op1',
        type: 'insert',
        position: 5,
        content: 'A',
        userId: 'user1',
        timestamp: new Date(),
        version: 1
      }

      const deleteOp: Operation = {
        id: 'op2',
        type: 'delete',
        position: 10,
        length: 3,
        userId: 'user2',
        timestamp: new Date(),
        version: 1
      }

      const [transformedInsert, transformedDelete] = OperationalTransform.transform(insertOp, deleteOp)

      expect(transformedInsert.type).toBe('insert')
      expect(transformedDelete.type).toBe('delete')
      expect(transformedInsert.userId).toBe('user1')
      expect(transformedDelete.userId).toBe('user2')
    })
  })
})