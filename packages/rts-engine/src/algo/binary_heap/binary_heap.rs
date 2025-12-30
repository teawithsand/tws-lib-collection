use std::marker::PhantomData;

/// Trait for heap ordering strategy
pub trait HeapOrdering {
    fn compare<T: Ord>(a: &T, b: &T) -> bool;
}

/// Min-heap ordering: smaller elements have higher priority
pub struct BinaryHeapMinOrdering;

impl HeapOrdering for BinaryHeapMinOrdering {
    fn compare<T: Ord>(a: &T, b: &T) -> bool {
        a < b
    }
}

/// Max-heap ordering: larger elements have higher priority
pub struct BinaryHeapMaxOrdering;

impl HeapOrdering for BinaryHeapMaxOrdering {
    fn compare<T: Ord>(a: &T, b: &T) -> bool {
        a > b
    }
}

/// A simple binary heap implementation generic over integer types and ordering
pub struct BinaryHeap<T, O: HeapOrdering = BinaryHeapMinOrdering> {
    data: Vec<T>,
    _marker: PhantomData<O>,
}

/// Type alias for min-heap
pub type MinBinaryHeap<T> = BinaryHeap<T, BinaryHeapMinOrdering>;

/// Type alias for max-heap
pub type MaxBinaryHeap<T> = BinaryHeap<T, BinaryHeapMaxOrdering>;

impl<T: Ord + Copy, O: HeapOrdering> BinaryHeap<T, O> {
    /// Creates a new empty binary heap
    pub fn new() -> Self {
        Self {
            data: Vec::new(),
            _marker: PhantomData,
        }
    }

    /// Creates a new binary heap with the specified capacity
    pub fn with_capacity(capacity: usize) -> Self {
        Self {
            data: Vec::with_capacity(capacity),
            _marker: PhantomData,
        }
    }

    /// Creates a binary heap from an existing vector
    pub fn from(vec: Vec<T>) -> Self {
        let mut heap = Self {
            data: vec,
            _marker: PhantomData,
        };
        // Heapify: start from last non-leaf node and sift down
        if heap.data.len() > 1 {
            for i in (0..heap.data.len() / 2).rev() {
                heap.sift_down(i);
            }
        }
        heap
    }

    /// Returns the number of elements in the heap
    pub fn len(&self) -> usize {
        self.data.len()
    }

    /// Returns true if the heap is empty
    pub fn is_empty(&self) -> bool {
        self.data.is_empty()
    }

    /// Inserts an element into the heap
    pub fn push(&mut self, value: T) {
        self.data.push(value);
        self.sift_up(self.data.len() - 1);
    }

    /// Removes and returns the minimum element from the heap
    pub fn pop(&mut self) -> Option<T> {
        if self.data.is_empty() {
            return None;
        }

        let last_idx = self.data.len() - 1;
        self.data.swap(0, last_idx);
        let result = self.data.pop();

        if !self.data.is_empty() {
            self.sift_down(0);
        }

        result
    }

    /// Returns a reference to the minimum element without removing it
    pub fn peek(&self) -> Option<&T> {
        self.data.first()
    }

    /// Clears the heap
    pub fn clear(&mut self) {
        self.data.clear();
    }

    /// Returns an iterator that drains elements from the heap in priority order
    pub fn drain(&mut self) -> Drain<'_, T, O> {
        Drain { heap: self }
    }

    /// Returns an iterator over the heap elements (not in sorted order)
    pub fn iter(&self) -> std::slice::Iter<'_, T> {
        self.as_slice().iter()
    }

    /// Returns a slice of the underlying data (not in sorted order)
    pub fn as_slice(&self) -> &[T] {
        &self.data
    }

    fn sift_up(&mut self, mut idx: usize) {
        while idx > 0 {
            let parent = (idx - 1) / 2;
            if !O::compare(&self.data[idx], &self.data[parent]) {
                break;
            }
            self.data.swap(idx, parent);
            idx = parent;
        }
    }

    fn sift_down(&mut self, mut idx: usize) {
        let len = self.data.len();
        loop {
            let left = 2 * idx + 1;
            let right = 2 * idx + 2;
            let mut priority = idx;

            if left < len && O::compare(&self.data[left], &self.data[priority]) {
                priority = left;
            }
            if right < len && O::compare(&self.data[right], &self.data[priority]) {
                priority = right;
            }

            if priority == idx {
                break;
            }

            self.data.swap(idx, priority);
            idx = priority;
        }
    }
}

impl<T: Ord + Copy, O: HeapOrdering> Default for BinaryHeap<T, O> {
    fn default() -> Self {
        Self::new()
    }
}

/// Iterator that drains elements from the heap in priority order
pub struct Drain<'a, T: Ord + Copy, O: HeapOrdering> {
    heap: &'a mut BinaryHeap<T, O>,
}

impl<'a, T: Ord + Copy, O: HeapOrdering> Iterator for Drain<'a, T, O> {
    type Item = T;

    fn next(&mut self) -> Option<Self::Item> {
        self.heap.pop()
    }

    fn size_hint(&self) -> (usize, Option<usize>) {
        let len = self.heap.len();
        (len, Some(len))
    }
}

impl<'a, T: Ord + Copy, O: HeapOrdering> ExactSizeIterator for Drain<'a, T, O> {
    fn len(&self) -> usize {
        self.heap.len()
    }
}
