use super::*;

#[test]
fn test_min_heap_push_pop() {
    let mut heap = MinBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);
    heap.push(1);

    assert_eq!(heap.pop(), Some(1));
    assert_eq!(heap.pop(), Some(3));
    assert_eq!(heap.pop(), Some(5));
    assert_eq!(heap.pop(), Some(7));
    assert_eq!(heap.pop(), None);
}

#[test]
fn test_max_heap_push_pop() {
    let mut heap = MaxBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);
    heap.push(1);

    assert_eq!(heap.pop(), Some(7));
    assert_eq!(heap.pop(), Some(5));
    assert_eq!(heap.pop(), Some(3));
    assert_eq!(heap.pop(), Some(1));
    assert_eq!(heap.pop(), None);
}

#[test]
fn test_min_heap_peek() {
    let mut heap = MinBinaryHeap::new();
    assert_eq!(heap.peek(), None);

    heap.push(10);
    assert_eq!(heap.peek(), Some(&10));

    heap.push(5);
    assert_eq!(heap.peek(), Some(&5));
}

#[test]
fn test_max_heap_peek() {
    let mut heap = MaxBinaryHeap::new();
    assert_eq!(heap.peek(), None);

    heap.push(10);
    assert_eq!(heap.peek(), Some(&10));

    heap.push(15);
    assert_eq!(heap.peek(), Some(&15));
}

#[test]
fn test_min_heap_signed_integers() {
    let mut heap = MinBinaryHeap::new();
    heap.push(-5);
    heap.push(3);
    heap.push(-10);
    heap.push(0);

    assert_eq!(heap.pop(), Some(-10));
    assert_eq!(heap.pop(), Some(-5));
    assert_eq!(heap.pop(), Some(0));
    assert_eq!(heap.pop(), Some(3));
}

#[test]
fn test_max_heap_signed_integers() {
    let mut heap = MaxBinaryHeap::new();
    heap.push(-5);
    heap.push(3);
    heap.push(-10);
    heap.push(0);

    assert_eq!(heap.pop(), Some(3));
    assert_eq!(heap.pop(), Some(0));
    assert_eq!(heap.pop(), Some(-5));
    assert_eq!(heap.pop(), Some(-10));
}

#[test]
fn test_min_heap_unsigned_integers() {
    let mut heap: MinBinaryHeap<u32> = MinBinaryHeap::new();
    heap.push(100);
    heap.push(50);
    heap.push(200);

    assert_eq!(heap.pop(), Some(50));
    assert_eq!(heap.pop(), Some(100));
    assert_eq!(heap.pop(), Some(200));
}

#[test]
fn test_max_heap_unsigned_integers() {
    let mut heap: MaxBinaryHeap<u32> = MaxBinaryHeap::new();
    heap.push(100);
    heap.push(50);
    heap.push(200);

    assert_eq!(heap.pop(), Some(200));
    assert_eq!(heap.pop(), Some(100));
    assert_eq!(heap.pop(), Some(50));
}

#[test]
fn test_min_heap_from_vec() {
    let vec = vec![5, 3, 7, 1, 9, 2];
    let mut heap = MinBinaryHeap::from(vec);

    assert_eq!(heap.pop(), Some(1));
    assert_eq!(heap.pop(), Some(2));
    assert_eq!(heap.pop(), Some(3));
    assert_eq!(heap.pop(), Some(5));
    assert_eq!(heap.pop(), Some(7));
    assert_eq!(heap.pop(), Some(9));
}

#[test]
fn test_max_heap_from_vec() {
    let vec = vec![5, 3, 7, 1, 9, 2];
    let mut heap = MaxBinaryHeap::from(vec);

    assert_eq!(heap.pop(), Some(9));
    assert_eq!(heap.pop(), Some(7));
    assert_eq!(heap.pop(), Some(5));
    assert_eq!(heap.pop(), Some(3));
    assert_eq!(heap.pop(), Some(2));
    assert_eq!(heap.pop(), Some(1));
}

#[test]
fn test_min_heap_clear() {
    let mut heap = MinBinaryHeap::new();
    heap.push(1);
    heap.push(2);
    heap.push(3);

    assert_eq!(heap.len(), 3);
    heap.clear();
    assert_eq!(heap.len(), 0);
    assert!(heap.is_empty());
}

#[test]
fn test_max_heap_with_capacity() {
    let mut heap: MaxBinaryHeap<i32> = MaxBinaryHeap::with_capacity(10);
    assert_eq!(heap.len(), 0);
    assert!(heap.is_empty());

    heap.push(5);
    assert_eq!(heap.len(), 1);
}

#[test]
fn test_min_heap_empty_from() {
    let vec: Vec<i32> = vec![];
    let mut heap = MinBinaryHeap::from(vec);
    assert!(heap.is_empty());
    assert_eq!(heap.pop(), None);
}

#[test]
fn test_max_heap_single_element() {
    let mut heap = MaxBinaryHeap::new();
    heap.push(42);
    assert_eq!(heap.peek(), Some(&42));
    assert_eq!(heap.pop(), Some(42));
    assert!(heap.is_empty());
}

#[test]
fn test_min_heap_drain_iterator() {
    let mut heap = MinBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);
    heap.push(1);
    heap.push(9);

    let drained: Vec<i32> = heap.drain().collect();
    assert_eq!(drained, vec![1, 3, 5, 7, 9]);
    assert!(heap.is_empty());
}

#[test]
fn test_max_heap_drain_iterator() {
    let mut heap = MaxBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);
    heap.push(1);
    heap.push(9);

    let drained: Vec<i32> = heap.drain().collect();
    assert_eq!(drained, vec![9, 7, 5, 3, 1]);
    assert!(heap.is_empty());
}

#[test]
fn test_as_slice() {
    let mut heap = MinBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);

    let slice = heap.as_slice();
    assert_eq!(slice.len(), 3);
    // Note: slice is not necessarily sorted, just heap-ordered
    assert!(slice.contains(&5));
    assert!(slice.contains(&3));
    assert!(slice.contains(&7));
}

#[test]
fn test_drain_size_hint() {
    let mut heap = MinBinaryHeap::new();
    heap.push(1);
    heap.push(2);
    heap.push(3);

    let mut drain = heap.drain();
    assert_eq!(drain.size_hint(), (3, Some(3)));
    assert_eq!(drain.len(), 3);

    drain.next();
    assert_eq!(drain.size_hint(), (2, Some(2)));
    assert_eq!(drain.len(), 2);
}

#[test]
fn test_iter() {
    let mut heap = MinBinaryHeap::new();
    heap.push(5);
    heap.push(3);
    heap.push(7);

    let items: Vec<&i32> = heap.iter().collect();
    assert_eq!(items.len(), 3);
    assert!(items.contains(&&5));
    assert!(items.contains(&&3));
    assert!(items.contains(&&7));

    // Verify heap is not consumed
    assert_eq!(heap.len(), 3);
}
