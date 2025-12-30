use std::marker::PhantomData;
use std::mem::MaybeUninit;

use super::trait_registry::{ReadRegistry, WriteRegistry};
use crate::algo::registry::HandleType;

/// A fixed-capacity registry backed by an array
/// Handles are indices into the array
/// Can store up to N items without heap allocation
pub struct ArrayRegistry<T, const N: usize, H: HandleType = usize> {
    items: [MaybeUninit<T>; N],
    len: usize,
    _pd: PhantomData<H>,
}

impl<T, const N: usize, H: HandleType> ArrayRegistry<T, N, H> {
    /// Create a new empty ArrayRegistry
    #[inline]
    pub fn new() -> Self {
        Self {
            items: std::array::from_fn(|_| MaybeUninit::uninit()),
            len: 0,
            _pd: PhantomData,
        }
    }

    /// Returns the maximum capacity of this registry
    #[inline]
    pub fn capacity(&self) -> usize {
        N
    }

    /// Returns true if the registry is at full capacity
    #[inline]
    pub fn is_full(&self) -> bool {
        self.len >= N
    }
}

impl<T, const N: usize, H: HandleType> Default for ArrayRegistry<T, N, H> {
    #[inline]
    fn default() -> Self {
        Self::new()
    }
}

impl<T, const N: usize, H: HandleType> Drop for ArrayRegistry<T, N, H> {
    #[inline]
    fn drop(&mut self) {
        // Drop all initialized items
        for i in 0..self.len {
            unsafe {
                self.items[i].assume_init_drop();
            }
        }
    }
}

impl<T, const N: usize, H: HandleType + 'static> ReadRegistry<T> for ArrayRegistry<T, N, H> {
    type Handle = H;

    #[inline]
    fn get(&self, handle: &Self::Handle) -> Option<&T> {
        let idx = handle.to_usize();
        if idx < self.len {
            Some(unsafe { self.items[idx].assume_init_ref() })
        } else {
            None
        }
    }

    #[inline]
    fn len(&self) -> usize {
        self.len
    }

    #[inline]
    fn iter<'a>(&'a self) -> impl Iterator<Item = (Self::Handle, &'a T)>
    where
        T: 'a,
    {
        self.items[..self.len]
            .iter()
            .enumerate()
            .map(|(i, v)| (H::from_usize(i).unwrap(), unsafe { v.assume_init_ref() }))
    }

    #[inline]
    fn handles(&self) -> impl Iterator<Item = Self::Handle>
    where
        Self::Handle: 'static,
    {
        (0..self.len).map(|i| H::from_usize(i).unwrap())
    }

    #[inline]
    fn get_mut(&mut self, handle: &Self::Handle) -> Option<&mut T> {
        let idx = handle.to_usize();
        if idx < self.len {
            Some(unsafe { self.items[idx].assume_init_mut() })
        } else {
            None
        }
    }

    #[inline]
    fn iter_mut<'a>(&'a mut self) -> impl Iterator<Item = (Self::Handle, &'a mut T)>
    where
        T: 'a,
    {
        let len = self.len;
        self.items[..len]
            .iter_mut()
            .enumerate()
            .map(|(i, v)| (H::from_usize(i).unwrap(), unsafe { v.assume_init_mut() }))
    }
}

impl<T, const N: usize, H: HandleType + 'static> WriteRegistry<T> for ArrayRegistry<T, N, H> {
    type Handle = H;

    #[inline]
    fn insert(&mut self, item: T) -> Self::Handle {
        assert!(self.len < N, "ArrayRegistry is full (capacity: {})", N);
        let idx = self.len;
        self.items[idx] = MaybeUninit::new(item);
        self.len += 1;
        H::from_usize(idx).unwrap()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_new_registry_is_empty() {
        let registry: ArrayRegistry<i32, 10> = ArrayRegistry::new();
        assert!(registry.is_empty());
        assert_eq!(registry.len(), 0);
    }

    #[test]
    fn test_capacity() {
        let registry: ArrayRegistry<i32, 5> = ArrayRegistry::new();
        assert_eq!(registry.capacity(), 5);
    }

    #[test]
    fn test_insert_returns_handle() {
        let mut registry = ArrayRegistry::<i32, 10>::new();
        let handle1 = registry.insert(42);
        let handle2 = registry.insert(99);

        assert_eq!(handle1, 0);
        assert_eq!(handle2, 1);
    }

    #[test]
    fn test_get_returns_inserted_item() {
        let mut registry = ArrayRegistry::<&str, 10>::new();
        let handle = registry.insert("hello");

        assert_eq!(registry.get(&handle), Some(&"hello"));
    }

    #[test]
    fn test_get_invalid_handle_returns_none() {
        let registry: ArrayRegistry<i32, 10> = ArrayRegistry::new();
        assert_eq!(registry.get(&0), None);
        assert_eq!(registry.get(&999), None);
    }

    #[test]
    fn test_len_tracks_item_count() {
        let mut registry = ArrayRegistry::<i32, 10>::new();
        assert_eq!(registry.len(), 0);

        registry.insert(1);
        assert_eq!(registry.len(), 1);

        registry.insert(2);
        assert_eq!(registry.len(), 2);

        registry.insert(3);
        assert_eq!(registry.len(), 3);
    }

    #[test]
    fn test_is_full() {
        let mut registry = ArrayRegistry::<i32, 3>::new();
        assert!(!registry.is_full());

        registry.insert(1);
        assert!(!registry.is_full());

        registry.insert(2);
        assert!(!registry.is_full());

        registry.insert(3);
        assert!(registry.is_full());
    }

    #[test]
    #[should_panic(expected = "ArrayRegistry is full")]
    fn test_insert_beyond_capacity_panics() {
        let mut registry = ArrayRegistry::<i32, 2>::new();
        registry.insert(1);
        registry.insert(2);
        registry.insert(3); // Should panic
    }

    #[test]
    fn test_iter_yields_all_items_in_order() {
        let mut registry = ArrayRegistry::<i32, 10>::new();
        let h1 = registry.insert(10);
        let h2 = registry.insert(20);
        let h3 = registry.insert(30);

        let items: Vec<_> = registry.iter().collect();

        assert_eq!(items.len(), 3);
        assert_eq!(items[0], (h1, &10));
        assert_eq!(items[1], (h2, &20));
        assert_eq!(items[2], (h3, &30));
    }

    #[test]
    fn test_handles_yields_all_handles() {
        let mut registry = ArrayRegistry::<char, 10>::new();
        registry.insert('a');
        registry.insert('b');
        registry.insert('c');

        let handles: Vec<_> = registry.handles().collect();

        assert_eq!(handles, vec![0, 1, 2]);
    }

    #[test]
    fn test_default_creates_empty_registry() {
        let registry: ArrayRegistry<String, 10> = ArrayRegistry::default();
        assert!(registry.is_empty());
    }

    #[test]
    fn test_get_mut() {
        let mut registry = ArrayRegistry::<i32, 10>::new();
        let handle = registry.insert(42);

        if let Some(value) = registry.get_mut(&handle) {
            *value = 100;
        }

        assert_eq!(registry.get(&handle), Some(&100));
    }

    #[test]
    fn test_iter_mut() {
        let mut registry = ArrayRegistry::<i32, 10>::new();
        registry.insert(1);
        registry.insert(2);
        registry.insert(3);

        for (_, value) in registry.iter_mut() {
            *value *= 2;
        }

        let values: Vec<_> = registry.iter().map(|(_, v)| *v).collect();
        assert_eq!(values, vec![2, 4, 6]);
    }
}
