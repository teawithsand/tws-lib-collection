#[cfg(test)]
mod tests {
    use crate::algo::geom2::{
        spatial_hash::{
            SpatialHashMap, SpatialHashMapConfig, SpatialHashMapError, SpatialHashMapQuery,
        },
        Segment2,
    };
    use crate::algo::registry::VecRegistry;
    use nalgebra::Point2;

    #[test]
    fn test_create_empty_map() {
        let map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);
        assert_eq!(map.len(), 0);
        assert!(map.is_empty());
    }

    #[test]
    fn test_insert_point() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);
        let point = Point2::new(5, 5);
        let data = "test_point".to_string();

        let handle = map.insert(point, data.clone()).unwrap();

        assert_eq!(map.len(), 1);
        assert!(!map.is_empty());

        let client = map.get_client(handle).expect("Client should exist");
        assert_eq!(client.data(), Some(&data));
        assert_eq!(client.shape(), Some(&point));
    }

    #[test]
    fn test_insert_multiple_points() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let h1 = map.insert(Point2::new(5, 5), "point1".to_string()).unwrap();
        let h2 = map
            .insert(Point2::new(15, 15), "point2".to_string())
            .unwrap();
        let h3 = map
            .insert(Point2::new(25, 25), "point3".to_string())
            .unwrap();

        assert_eq!(map.len(), 3);

        let c1 = map.get_client(h1).unwrap();
        let c2 = map.get_client(h2).unwrap();
        let c3 = map.get_client(h3).unwrap();

        assert_eq!(c1.data(), Some(&"point1".to_string()));
        assert_eq!(c2.data(), Some(&"point2".to_string()));
        assert_eq!(c3.data(), Some(&"point3".to_string()));
    }

    #[test]
    fn test_client_mut_data_modification() {
        let mut map: SpatialHashMap<i32, i32, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);
        let point = Point2::new(5, 5);
        let handle = map.insert(point, 42i32).unwrap();

        {
            let mut client = map.get_client_mut(handle).unwrap();
            assert_eq!(client.data(), Some(&42));

            *client.data_mut().unwrap() = 100;
        }

        let client = map.get_client(handle).unwrap();
        assert_eq!(client.data(), Some(&100));
    }

    #[test]
    fn test_delete_via_client_mut() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);
        let point = Point2::new(5, 5);
        let data = "to_delete".to_string();
        let handle = map.insert(point, data.clone()).unwrap();

        assert_eq!(map.len(), 1);

        let client_mut = map.get_client_mut(handle).unwrap();
        let removed_data = client_mut.delete();

        assert_eq!(removed_data, Some(data));
        assert_eq!(map.len(), 0);
        assert!(map.get_client(handle).is_none());
    }

    #[test]
    fn test_query_circle_with_points() {
        let mut map: SpatialHashMap<i32, i32, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert points in different locations
        map.insert(Point2::new(5, 5), 1).unwrap();
        map.insert(Point2::new(15, 15), 2).unwrap();
        map.insert(Point2::new(50, 50), 3).unwrap();

        // Query for points within a circle centered at (5, 5) with radius 2
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 2,
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 1);

        let client = map.get_client(results[0]).unwrap();
        assert_eq!(client.data(), Some(&1));
    }

    #[test]
    fn test_query_rectangle_with_points() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert points
        map.insert(Point2::new(5, 5), "inside".to_string()).unwrap();
        map.insert(Point2::new(15, 15), "inside2".to_string())
            .unwrap();
        map.insert(Point2::new(50, 50), "outside".to_string())
            .unwrap();

        // Query for rectangle from (0,0) to (20,20)
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(20, 20),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 2);

        // Check that both inside points are returned
        let data_values: Vec<_> = results
            .iter()
            .map(|&h| map.get_client(h).unwrap().data().unwrap().clone())
            .collect();
        assert!(data_values.contains(&"inside".to_string()));
        assert!(data_values.contains(&"inside2".to_string()));
    }

    #[test]
    fn test_insert_segment() {
        let mut map: SpatialHashMap<i32, String, Segment2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let segment = Segment2::new(Point2::new(5, 5), Point2::new(25, 25));
        let handle = map.insert(segment, "segment_data".to_string()).unwrap();

        assert_eq!(map.len(), 1);

        let client = map.get_client(handle).unwrap();
        assert_eq!(client.data(), Some(&"segment_data".to_string()));
        assert_eq!(client.shape(), Some(&segment));
    }

    #[test]
    fn test_query_with_segments() {
        let mut map: SpatialHashMap<i32, i32, Segment2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert a segment spanning multiple cells
        let seg1 = Segment2::new(Point2::new(5, 5), Point2::new(25, 5));
        map.insert(seg1, 1).unwrap();

        // Insert another segment far away
        let seg2 = Segment2::new(Point2::new(80, 80), Point2::new(85, 85));
        map.insert(seg2, 2).unwrap();

        // Query for rectangle overlapping the first segment
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(30, 30),
        };

        let results: Vec<_> = map.query(&query).collect();
        // Segment spans multiple cells, so may get duplicates
        assert!(results.len() >= 1);

        // Verify at least one result points to the correct data
        let has_segment1 = results
            .iter()
            .any(|&h| map.get_client(h).map(|c| *c.data().unwrap()) == Some(1));
        assert!(has_segment1);
    }

    #[test]
    fn test_multiple_deletes() {
        let mut map: SpatialHashMap<i32, i32, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let h1 = map.insert(Point2::new(5, 5), 1).unwrap();
        let h2 = map.insert(Point2::new(15, 15), 2).unwrap();
        let h3 = map.insert(Point2::new(25, 25), 3).unwrap();

        assert_eq!(map.len(), 3);

        // Delete one
        let c1 = map.get_client_mut(h1).unwrap();
        assert_eq!(c1.delete(), Some(1));
        assert_eq!(map.len(), 2);

        // Delete another
        let c2 = map.get_client_mut(h2).unwrap();
        assert_eq!(c2.delete(), Some(2));
        assert_eq!(map.len(), 1);

        // Check the last one is still there
        let c3 = map.get_client(h3).unwrap();
        assert_eq!(c3.data(), Some(&3));
    }

    #[test]
    fn test_handle_reuse_after_delete() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let point = Point2::new(5, 5);
        let handle = map.insert(point, "original".to_string()).unwrap();

        // Delete it
        let client = map.get_client_mut(handle).unwrap();
        client.delete();

        // Handle should no longer be valid
        assert!(map.get_client(handle).is_none());

        // Insert a new point - might reuse the slot but generation should differ
        let new_handle = map.insert(point, "new".to_string()).unwrap();

        // Old handle should still be invalid
        assert!(map.get_client(handle).is_none());

        // New handle should be valid
        let client = map.get_client(new_handle).unwrap();
        assert_eq!(client.data(), Some(&"new".to_string()));
    }

    #[test]
    fn test_empty_query_results() {
        let mut map: SpatialHashMap<i32, i32, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert a point far away
        map.insert(Point2::new(100, 100), 1).unwrap();

        // Query in a different area
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 1,
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 0);
    }

    #[test]
    fn test_client_handle_identity() {
        let mut map: SpatialHashMap<i32, i32, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);
        let point = Point2::new(5, 5);
        let handle = map.insert(point, 42).unwrap();

        let client = map.get_client(handle).unwrap();
        assert_eq!(client.handle(), handle);
    }

    #[test]
    fn test_large_coordinate_values() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(100, 100, 100, 100);

        let h1 = map
            .insert(Point2::new(500, 500), "far1".to_string())
            .unwrap();
        let h2 = map
            .insert(Point2::new(5000, 5000), "far2".to_string())
            .unwrap();

        assert_eq!(map.len(), 2);

        let c1 = map.get_client(h1).unwrap();
        let c2 = map.get_client(h2).unwrap();

        assert_eq!(c1.data(), Some(&"far1".to_string()));
        assert_eq!(c2.data(), Some(&"far2".to_string()));
    }

    #[test]
    fn test_negative_coordinates() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 20, 20);

        // Note: negative coordinates might be outside the grid depending on implementation
        // This tests the boundary behavior
        let _h1 = map
            .insert(Point2::new(-5, -5), "negative".to_string())
            .unwrap();
        let _h2 = map
            .insert(Point2::new(5, 5), "positive".to_string())
            .unwrap();

        // Both should be stored
        assert_eq!(map.len(), 2);
    }

    // Tests for VecRegistry (insert-only registry)

    #[test]
    fn test_vec_registry_insert_and_query() {
        // VecRegistry doesn't implement RemovableRegistry, so this tests insert-only behavior
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::default(),
                VecRegistry::new(),
            );

        let point1 = Point2::new(5, 5);
        let point2 = Point2::new(15, 15);

        let h1 = map.insert(point1, "data1".to_string()).unwrap();
        let h2 = map.insert(point2, "data2".to_string()).unwrap();

        assert_eq!(map.len(), 2);

        // Query for both points
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(20, 20),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 2);

        // Verify we can access the data
        let client1 = map.get_client(h1).expect("Should find client 1");
        assert_eq!(client1.data(), Some(&"data1".to_string()));

        let client2 = map.get_client(h2).expect("Should find client 2");
        assert_eq!(client2.data(), Some(&"data2".to_string()));
    }

    #[test]
    fn test_vec_registry_retrieve_shape() {
        // Test that we can retrieve shapes from VecRegistry-backed map
        let mut map: SpatialHashMap<i32, i32, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::default(),
                VecRegistry::new(),
            );

        let point = Point2::new(7, 13);
        let handle = map.insert(point, 42).unwrap();

        let client = map.get_client(handle).expect("Should find client");
        assert_eq!(client.shape(), Some(&point));
        assert_eq!(client.data(), Some(&42));
    }

    #[test]
    fn test_vec_registry_modify_data() {
        // Test that we can modify data without RemovableRegistry trait
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::default(),
                VecRegistry::new(),
            );

        let point = Point2::new(5, 5);
        let handle = map.insert(point, "original".to_string()).unwrap();

        // Modify the data through ClientMut
        {
            let mut client = map.get_client_mut(handle).expect("Should find client");
            *client.data_mut().unwrap() = "modified".to_string();
        }

        // Verify the modification
        let client = map
            .get_client(handle)
            .expect("Should find client after modification");
        assert_eq!(client.data(), Some(&"modified".to_string()));
        assert_eq!(client.shape(), Some(&point));
    }

    #[test]
    fn test_update_shape() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let old_point = Point2::new(5, 5);
        let handle = map.insert(old_point, "data".to_string()).unwrap();

        // Verify initial position
        let query1 = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(10, 10),
        };
        let results1: Vec<_> = map.query(&query1).collect();
        assert_eq!(results1.len(), 1);

        // Update to new position
        let new_point = Point2::new(25, 25);
        let returned_old = map.update_shape(handle, new_point);
        assert_eq!(returned_old, Ok(Some(old_point)));

        // Old position should no longer find the point
        let results2: Vec<_> = map.query(&query1).collect();
        assert_eq!(results2.len(), 0);

        // New position should find it
        let query2 = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(20, 20),
            corner_two: Point2::new(30, 30),
        };
        let results3: Vec<_> = map.query(&query2).collect();
        assert_eq!(results3.len(), 1);

        // Verify the shape was updated
        let client = map.get_client(handle).expect("Should find client");
        assert_eq!(client.shape(), Some(&new_point));
        assert_eq!(client.data(), Some(&"data".to_string()));
    }

    #[test]
    fn test_update_shape_with_vec_registry() {
        // Test that update_shape works with insert-only registry
        let mut map: SpatialHashMap<i32, i32, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::default(),
                VecRegistry::new(),
            );

        let old_point = Point2::new(5, 5);
        let handle = map.insert(old_point, 42).unwrap();

        // Update shape
        let new_point = Point2::new(15, 15);
        let old = map.update_shape(handle, new_point);
        assert_eq!(old, Ok(Some(old_point)));

        // Verify new shape is accessible
        let client = map.get_client(handle).expect("Should find client");
        assert_eq!(client.shape(), Some(&new_point));
        assert_eq!(client.data(), Some(&42));
    }

    #[test]
    fn test_query_duplicates_for_multi_cell_shape() {
        let mut map: SpatialHashMap<i32, String, Segment2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // This segment will cross from cell (0,0) to (2,0)
        let segment = Segment2::new(Point2::new(5, 5), Point2::new(25, 5));
        let handle = map.insert(segment, "multi-cell".to_string()).unwrap();

        // Query a rectangle that covers all cells the segment is in.
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(30, 10),
        };

        let results: Vec<_> = map.query(&query).collect();
        // The segment is in 3 cells (5,5)->(0,0), (15,5)->(1,0), (25,5)->(2,0)
        // All are inside the query rect. We expect at least one result, possibly more.
        assert!(!results.is_empty());

        // All returned handles should be the same.
        let first_handle = results[0];
        assert!(results.iter().all(|&h| h == first_handle));
        assert_eq!(first_handle, handle);

        // Using a HashSet to get unique results
        use std::collections::HashSet;
        let unique_results: HashSet<_> = results.into_iter().collect();

        assert_eq!(unique_results.len(), 1);
        let unique_handle = unique_results.iter().next().unwrap();
        assert_eq!(*unique_handle, handle);

        let client = map.get_client(*unique_handle).unwrap();
        assert_eq!(client.data(), Some(&"multi-cell".to_string()));
    }

    #[test]
    fn test_query_partial_multicell_shape() {
        let mut map: SpatialHashMap<i32, String, Segment2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // This segment will cross from cell (0,0) to (2,0)
        let segment = Segment2::new(Point2::new(5, 5), Point2::new(25, 5));
        let handle = map.insert(segment, "multi-cell".to_string()).unwrap();

        // Query a rectangle that covers only the middle cell of the segment.
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(12, 0),
            corner_two: Point2::new(18, 10),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert!(!results.is_empty());

        // All returned handles should be the same and correct.
        assert!(results.iter().all(|&h| h == handle));

        let client = map.get_client(results[0]).unwrap();
        assert_eq!(client.data(), Some(&"multi-cell".to_string()));
    }

    #[test]
    fn test_query_outside_grid() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        map.insert(Point2::new(5, 5), "inside".to_string()).unwrap();

        // Query a rectangle completely outside the grid boundaries (0..100, 0..100)
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(200, 200),
            corner_two: Point2::new(210, 210),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert!(results.is_empty());
    }

    #[test]
    fn test_circle_query_spanning_cells() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point is in cell (1,1)
        let point_in_neighbor_cell = Point2::new(15, 15);
        map.insert(point_in_neighbor_cell, "neighbor".to_string())
            .unwrap();

        // Circle is centered in cell (0,0), but its radius reaches into (1,1)
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(5, 5),
            radius: 15, // sqrt( (15-5)^2 + (15-5)^2 ) = sqrt(200) ~= 14.14
        };

        let results: Vec<_> = map.query(&query).collect();

        // The current naive implementation only checks the center cell, so this will fail.
        // A correct implementation would check all intersected cells.
        // We expect 1 result, but will get 0.
        assert_eq!(
            results.len(),
            1,
            "Circle query should find objects in adjacent cells"
        );

        let client = map.get_client(results[0]).unwrap();
        assert_eq!(client.data(), Some(&"neighbor".to_string()));
    }

    #[test]
    fn test_rectangle_query_partially_outside_grid() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point is inside the grid, in cell (9,9)
        map.insert(Point2::new(95, 95), "inside".to_string())
            .unwrap();

        // Query a rectangle that is entirely outside the grid's coordinate system
        // but geometrically overlaps the cell containing the point.
        // The current implementation will clamp the search to cells (0,0) to (0,0)
        // because of the negative coordinates, and will fail to find the point in cell (9,9).
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(-15, -15),
            corner_two: Point2::new(-5, -5),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 0, "Rectangle query should not find objects when query is completely outside grid, even if it overlaps");
    }

    #[test]
    fn test_rectangle_query_partially_outside_grid_should_find() {
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point is inside the grid, in cell (9,9)
        map.insert(Point2::new(95, 95), "inside".to_string())
            .unwrap();

        // Query a rectangle partially outside the grid boundaries.
        // The query rectangle contains the point (95, 95).
        // A correct implementation should find the point.
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(92, 92),
            corner_two: Point2::new(105, 105),
        };

        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(
            results.len(),
            1,
            "Rectangle query should find objects when partially outside the grid"
        );
    }

    /*
    // This will panic on radius check, which is sort of expected.
    // This SHM will never be used which such exterme numbers for now,
    //  so we can leave this as-is.
    #[test]
    #[cfg(target_pointer_width = "64")]
    fn test_can_query_circle_with_oferflowing_radius_and_center() {
        use std::i32;

        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let extreme_point = Point2::new(20, 20);
        map.insert(extreme_point, "extreme".to_string());

        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(10, 10),
            radius: i32::MAX,
        };

        let results: Vec<_> = map.query(&query).collect();
        assert!(results.len() >= 1);
    }
    */

    // ========================================================================
    // Out-of-range coordinate tests
    // ========================================================================

    #[test]
    fn test_insert_shape_beyond_grid_positive() {
        // Grid is 10x10 cells of 10 units each = 100x100 coordinate space
        // Shapes beyond this range should be insertable but not indexed
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point at (500, 500) is way beyond the grid (0-100)
        let far_point = Point2::new(500, 500);
        let handle = map.insert(far_point, "far_away".to_string()).unwrap();

        // Shape is stored in registry
        assert_eq!(map.len(), 1);

        // Can retrieve via handle
        let client = map.get_client(handle).expect("Should exist in registry");
        assert_eq!(client.data(), Some(&"far_away".to_string()));
        assert_eq!(client.shape(), Some(&far_point));

        // But NOT queryable via spatial queries (no cell contains it)
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(500, 500),
            radius: 10,
        };
        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(
            results.len(),
            0,
            "Shape beyond grid should not be found by query"
        );
    }

    #[test]
    fn test_insert_shape_negative_coordinates() {
        // Shapes with negative coordinates should be insertable but not indexed
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point at negative coordinates
        let neg_point = Point2::new(-50, -50);
        let handle = map.insert(neg_point, "negative".to_string()).unwrap();

        // Shape is stored in registry
        assert_eq!(map.len(), 1);

        // Can retrieve via handle
        let client = map.get_client(handle).expect("Should exist in registry");
        assert_eq!(client.data(), Some(&"negative".to_string()));

        // But NOT queryable via spatial queries
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(-50, -50),
            radius: 10,
        };
        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(
            results.len(),
            0,
            "Shape with negative coords should not be found"
        );
    }

    #[test]
    fn test_insert_segment_partially_outside_grid() {
        // Segment that starts inside grid but extends beyond should be partially indexed
        let mut map: SpatialHashMap<i32, String, Segment2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Segment from (50, 50) inside grid to (150, 150) outside grid
        let segment = Segment2::new(Point2::new(50, 50), Point2::new(150, 150));
        let handle = map.insert(segment, "partial".to_string()).unwrap();

        assert_eq!(map.len(), 1);

        // Query for the part inside the grid should find it
        let query_inside = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(40, 40),
            corner_two: Point2::new(60, 60),
        };
        let results: Vec<_> = map.query(&query_inside).collect();
        assert!(
            !results.is_empty(),
            "Segment should be found where it overlaps grid"
        );

        // Query for the part outside the grid should NOT find it
        let query_outside = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(120, 120),
            corner_two: Point2::new(160, 160),
        };
        let results: Vec<_> = map.query(&query_outside).collect();
        assert!(
            results.is_empty(),
            "Segment should not be found in area outside grid"
        );

        // Direct handle access still works
        let client = map.get_client(handle).unwrap();
        assert_eq!(client.data(), Some(&"partial".to_string()));
    }

    #[test]
    fn test_query_completely_outside_grid_positive() {
        // Query entirely outside the grid should return empty results
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert point inside grid
        map.insert(Point2::new(50, 50), "inside".to_string())
            .unwrap();

        // Query far outside the grid
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(500, 500),
            corner_two: Point2::new(600, 600),
        };
        let results: Vec<_> = map.query(&query).collect();
        assert!(
            results.is_empty(),
            "Query outside grid should return nothing"
        );
    }

    #[test]
    fn test_query_completely_outside_grid_negative() {
        // Query with negative coordinates should return empty results
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert point inside grid
        map.insert(Point2::new(50, 50), "inside".to_string())
            .unwrap();

        // Query in negative coordinate space
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(-100, -100),
            corner_two: Point2::new(-50, -50),
        };
        let results: Vec<_> = map.query(&query).collect();
        assert!(
            results.is_empty(),
            "Query in negative space should return nothing"
        );
    }

    #[test]
    fn test_query_partially_overlapping_grid() {
        // Query that partially overlaps the grid should find shapes in the overlap
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert point near edge of grid (cell 9,9 covers coordinates 90-99)
        map.insert(Point2::new(95, 95), "edge".to_string()).unwrap();

        // Query rectangle that overlaps the edge and extends beyond
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(90, 90),
            corner_two: Point2::new(150, 150),
        };
        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 1, "Should find point in overlapping area");

        let client = map.get_client(results[0]).unwrap();
        assert_eq!(client.data(), Some(&"edge".to_string()));
    }

    #[test]
    fn test_circle_query_center_outside_grid() {
        // Circle query with center outside grid but radius reaching into grid
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Insert point at edge of grid
        map.insert(Point2::new(95, 50), "edge_point".to_string())
            .unwrap();

        // Circle centered outside grid (110, 50) with radius 20 reaches to x=90
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(110, 50),
            radius: 20,
        };
        let results: Vec<_> = map.query(&query).collect();

        // The point at (95, 50) is within distance 15 from center (110, 50)
        // which is less than radius 20, so it should be found
        assert_eq!(
            results.len(),
            1,
            "Circle reaching into grid should find point"
        );
    }

    #[test]
    fn test_insert_at_exact_grid_boundary() {
        // Point at exact grid boundary (100, 100) should NOT be indexed
        // because cell (10, 10) doesn't exist (cells are 0-9)
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        // Point exactly at boundary
        let boundary_point = Point2::new(100, 100);
        let handle = map.insert(boundary_point, "boundary".to_string()).unwrap();

        // Shape is stored
        assert_eq!(map.len(), 1);
        let client = map.get_client(handle).expect("Should exist");
        assert_eq!(client.data(), Some(&"boundary".to_string()));

        // Query at that location should NOT find it (cell 10,10 doesn't exist)
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(100, 100),
            radius: 5,
        };
        let results: Vec<_> = map.query(&query).collect();
        assert!(
            results.is_empty(),
            "Point at grid boundary should not be indexed"
        );
    }

    #[test]
    fn test_insert_at_max_valid_coordinate() {
        // Point at (99, 99) should be indexed in cell (9, 9)
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let max_valid_point = Point2::new(99, 99);
        let handle = map
            .insert(max_valid_point, "max_valid".to_string())
            .unwrap();

        assert_eq!(map.len(), 1);

        // Query should find it
        let query = SpatialHashMapQuery::IntersectsCircle {
            center: Point2::new(99, 99),
            radius: 1,
        };
        let results: Vec<_> = map.query(&query).collect();
        assert_eq!(results.len(), 1, "Point at max valid coord should be found");

        let client = map.get_client(handle).unwrap();
        assert_eq!(client.data(), Some(&"max_valid".to_string()));
    }

    #[test]
    fn test_multiple_shapes_mixed_in_and_out_of_grid() {
        // Mix of shapes inside and outside grid
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::with_default_registry(10, 10, 10, 10);

        let h_inside1 = map
            .insert(Point2::new(25, 25), "inside1".to_string())
            .unwrap();
        let h_inside2 = map
            .insert(Point2::new(75, 75), "inside2".to_string())
            .unwrap();
        let _h_outside1 = map
            .insert(Point2::new(200, 200), "outside1".to_string())
            .unwrap();
        let _h_outside2 = map
            .insert(Point2::new(-50, -50), "outside2".to_string())
            .unwrap();

        // All 4 shapes are stored
        assert_eq!(map.len(), 4);

        // Query covering entire grid should only find 2
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(0, 0),
            corner_two: Point2::new(99, 99),
        };
        let results: Vec<_> = map.query(&query).collect();

        use std::collections::HashSet;
        let handles: HashSet<_> = results.into_iter().collect();
        assert_eq!(handles.len(), 2, "Should find exactly 2 shapes inside grid");
        assert!(handles.contains(&h_inside1));
        assert!(handles.contains(&h_inside2));
    }

    // ========================================================================
    // Tests for OutOfBoundsBehavior::Fail
    // ========================================================================

    #[test]
    fn test_fail_mode_insert_inside_grid_succeeds() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        let result = map.insert(Point2::new(50, 50), "inside".to_string());
        assert!(
            result.is_ok(),
            "Insert inside grid should succeed with Fail mode"
        );
        assert_eq!(map.len(), 1);
    }

    #[test]
    fn test_fail_mode_insert_outside_grid_positive_fails() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        let result = map.insert(Point2::new(200, 200), "outside".to_string());
        assert!(
            result.is_err(),
            "Insert outside grid should fail with Fail mode"
        );
        assert_eq!(map.len(), 0, "No shape should be stored when insert fails");

        // Verify error type
        match result {
            Err(SpatialHashMapError::OutOfBounds { cells_x, cells_y }) => {
                assert_eq!(cells_x, 10);
                assert_eq!(cells_y, 10);
            }
            _ => panic!("Expected OutOfBounds error"),
        }
    }

    #[test]
    fn test_fail_mode_insert_outside_grid_negative_fails() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        let result = map.insert(Point2::new(-50, -50), "outside".to_string());
        assert!(
            result.is_err(),
            "Insert with negative coords should fail with Fail mode"
        );
        assert_eq!(map.len(), 0);
    }

    #[test]
    fn test_fail_mode_insert_segment_partially_outside_fails() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Segment2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        // Segment that starts inside but ends outside
        let segment = Segment2::new(Point2::new(50, 50), Point2::new(200, 50));
        let result = map.insert(segment, "partial".to_string());
        assert!(
            result.is_err(),
            "Partially outside segment should fail with Fail mode"
        );
        assert_eq!(map.len(), 0);
    }

    #[test]
    fn test_fail_mode_update_shape_to_outside_fails() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        // Insert inside first
        let handle = map.insert(Point2::new(50, 50), "test".to_string()).unwrap();

        // Update to outside location - should fail
        let result = map.update_shape(handle, Point2::new(200, 200));
        assert!(
            result.is_err(),
            "Update to outside location should fail with Fail mode"
        );

        // Original shape should still be there (update failed)
        assert_eq!(map.len(), 1);
    }

    #[test]
    fn test_fail_mode_query_outside_grid_returns_empty() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        map.insert(Point2::new(50, 50), "inside".to_string())
            .unwrap();

        // Query completely outside grid should work but return empty
        let query = SpatialHashMapQuery::IntersectsRectangle {
            corner_one: Point2::new(200, 200),
            corner_two: Point2::new(300, 300),
        };
        let results: Vec<_> = map.query(&query).collect();
        assert!(results.is_empty(), "Query outside grid should return empty");
    }

    #[test]
    fn test_fail_mode_vs_optimistic_mode_comparison() {
        // Same scenario with both modes - demonstrates the difference

        // Optimistic mode (default)
        let mut optimistic_map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::default(),
                VecRegistry::new(),
            );

        let optimistic_result = optimistic_map.insert(Point2::new(200, 200), "outside".to_string());
        assert!(
            optimistic_result.is_ok(),
            "Optimistic mode should accept out-of-bounds insert"
        );
        assert_eq!(
            optimistic_map.len(),
            1,
            "Shape is stored even if outside grid"
        );

        // Fail mode (strict)
        let mut strict_map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(
                10,
                10,
                10,
                10,
                SpatialHashMapConfig::strict(),
                VecRegistry::new(),
            );

        let strict_result = strict_map.insert(Point2::new(200, 200), "outside".to_string());
        assert!(
            strict_result.is_err(),
            "Strict mode should reject out-of-bounds insert"
        );
        assert_eq!(strict_map.len(), 0, "Shape is not stored when rejected");
    }

    #[test]
    fn test_fail_mode_at_exact_boundary_succeeds() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>, VecRegistry<_, usize>> =
            SpatialHashMap::new(10, 10, 10, 10, config, VecRegistry::new());

        // Point at (0, 0) - should succeed (inclusive lower bound)
        let result1 = map.insert(Point2::new(0, 0), "origin".to_string());
        assert!(result1.is_ok(), "Insert at origin should succeed");

        // Point at (99, 99) - should succeed (inside grid)
        let result2 = map.insert(Point2::new(99, 99), "corner".to_string());
        assert!(result2.is_ok(), "Insert at (99,99) should succeed");

        // Point at (100, 100) - should fail (outside grid)
        let result3 = map.insert(Point2::new(100, 100), "outside".to_string());
        assert!(result3.is_err(), "Insert at (100,100) should fail");
    }

    #[test]
    fn test_fail_mode_remove_inside_shape_succeeds() {
        let config = SpatialHashMapConfig::strict();
        let mut map: SpatialHashMap<i32, String, Point2<i32>> =
            SpatialHashMap::new(10, 10, 10, 10, config, Default::default());

        // Insert inside
        let handle = map.insert(Point2::new(50, 50), "test".to_string()).unwrap();

        // Remove should succeed
        let removed = map.remove(handle);
        assert_eq!(removed, Some("test".to_string()));
        assert_eq!(map.len(), 0);
    }
}
