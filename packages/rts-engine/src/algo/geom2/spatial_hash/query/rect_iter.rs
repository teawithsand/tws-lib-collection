use crate::algo::geom2::spatial_hash::coord::SpatialHashMapCoord;

/// Iterator state for rectangular cell iteration (used by Rectangle and Circle queries)
#[derive(Debug, Clone)]
pub struct RectCellIter<C> {
    min_cx: C,
    max_cx: C,
    max_cy: C,
    current_cx: C,
    current_cy: C,
    done: bool,
}

impl<C> RectCellIter<C>
where
    C: Copy,
{
    /// Create a new rectangular cell iterator
    pub fn new(min_cx: C, max_cx: C, min_cy: C, max_cy: C) -> Self {
        Self {
            min_cx,
            max_cx,
            max_cy,
            current_cx: min_cx,
            current_cy: min_cy,
            done: false,
        }
    }
}

impl<C> Iterator for RectCellIter<C>
where
    C: SpatialHashMapCoord + PartialOrd + Copy + std::ops::Add<Output = C> + From<u8>,
{
    type Item = (C, C);

    fn next(&mut self) -> Option<Self::Item> {
        if self.done {
            return None;
        }

        let result = (self.current_cx, self.current_cy);

        // Advance to next cell
        self.current_cx = self.current_cx + C::from(1u8);
        if self.current_cx > self.max_cx {
            self.current_cx = self.min_cx;
            self.current_cy = self.current_cy + C::from(1u8);
            if self.current_cy > self.max_cy {
                self.done = true;
            }
        }

        Some(result)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashSet;

    #[test]
    fn test_rect_iter_single_cell() {
        let iter = RectCellIter::new(0i32, 0, 0, 0);
        let cells: Vec<_> = iter.collect();
        assert_eq!(cells, vec![(0, 0)]);
    }

    #[test]
    fn test_rect_iter_row() {
        let iter = RectCellIter::new(0i32, 2, 0, 0);
        let cells: Vec<_> = iter.collect();
        assert_eq!(cells, vec![(0, 0), (1, 0), (2, 0)]);
    }

    #[test]
    fn test_rect_iter_column() {
        let iter = RectCellIter::new(0i32, 0, 0, 2);
        let cells: Vec<_> = iter.collect();
        assert_eq!(cells, vec![(0, 0), (0, 1), (0, 2)]);
    }

    #[test]
    fn test_rect_iter_grid() {
        let iter = RectCellIter::new(1i32, 2, 1, 2);
        let cells: HashSet<_> = iter.collect();
        let expected: HashSet<_> = [(1, 1), (2, 1), (1, 2), (2, 2)].iter().copied().collect();
        assert_eq!(cells, expected);
    }
}
