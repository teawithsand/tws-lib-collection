use crate::algo::{
    geom2::spatial_hash::{
        cell::Cell,
        client::{Client, ClientHandle, ClientMut},
        config::{OutOfBoundsBehavior, SpatialHashMapConfig},
        error::SpatialHashMapError,
        insertable::{Aabb, SpatialHashMapShape, SpatialHashMapSpec},
        query::SpatialHashMapQuery,
        SpatialHashMapCoord,
    },
    registry::{GenerationalRegistry, ReadRegistry, RemovableRegistry, WriteRegistry},
};

/// Internal storage combining user data and shape
#[derive(Debug)]
pub struct ClientData<D, T> {
    pub(super) data: D,
    pub(super) shape: T,
}

/// A spatial hash map for efficient spatial queries.
///
/// Type parameters:
/// - C: Coordinate type (must implement SpatialHashMapCoord)
/// - D: User data type
/// - T: Shape type (must implement SpatialHashMapShape<C>)
/// - R: Registry type (must implement ReadRegistry + WriteRegistry)
#[derive(Debug)]
pub struct SpatialHashMap<C, D, T, R = GenerationalRegistry<ClientData<D, T>, usize, usize>>
where
    R: ReadRegistry<ClientData<D, T>> + WriteRegistry<ClientData<D, T>>,
{
    cell_x: C,
    cell_y: C,
    cells_x: usize,
    cells_y: usize,

    config: SpatialHashMapConfig,

    client_registry: R,

    cells: Vec<Cell<<R as ReadRegistry<ClientData<D, T>>>::Handle>>,
}

impl<C: SpatialHashMapCoord, D, T, R> SpatialHashMap<C, D, T, R>
where
    R: ReadRegistry<ClientData<D, T>> + WriteRegistry<ClientData<D, T>>,
{
    /// Create a new spatial hash map.
    ///
    /// # Arguments
    /// * `cell_x` - Width of each cell
    /// * `cell_y` - Height of each cell
    /// * `cells_x` - Number of cells in the x direction
    /// * `cells_y` - Number of cells in the y direction
    /// * `config` - Configuration for the spatial hash map
    /// * `registry` - The registry instance to use for storing clients
    pub fn new(
        cell_x: C,
        cell_y: C,
        cells_x: usize,
        cells_y: usize,
        config: SpatialHashMapConfig,
        registry: R,
    ) -> Self {
        let cell_count = cells_x.strict_mul(cells_y);

        let mut cells = Vec::new();
        cells.resize_with(cell_count, Cell::default);

        SpatialHashMap {
            cell_x,
            cell_y,
            cells_x,
            cells_y,
            config,
            cells,
            client_registry: registry,
        }
    }

    /// Create a new spatial hash map with a default registry and default config.
    ///
    /// # Arguments
    /// * `cell_x` - Width of each cell
    /// * `cell_y` - Height of each cell
    /// * `cells_x` - Number of cells in the x direction
    /// * `cells_y` - Number of cells in the y direction
    pub fn with_default_registry(cell_x: C, cell_y: C, cells_x: usize, cells_y: usize) -> Self
    where
        R: Default,
    {
        Self::new(
            cell_x,
            cell_y,
            cells_x,
            cells_y,
            SpatialHashMapConfig::default(),
            R::default(),
        )
    }

    /// Get the cell index for a given cell coordinate.
    fn get_cell_idx(&self, cx: C, cy: C) -> Option<usize> {
        let cx_usize = cx.into_usize_checked()?;
        let cy_usize = cy.into_usize_checked()?;

        if cx_usize >= self.cells_x || cy_usize >= self.cells_y {
            return None;
        }

        Some(cy_usize * self.cells_x + cx_usize)
    }

    /// Check if a shape's AABB is within the grid bounds (for Fail mode).
    ///
    /// Returns `Ok(())` if the shape is in bounds or config is Optimistic.
    /// Returns `Err(OutOfBounds)` if the shape extends outside the grid and config is Fail.
    fn check_aabb_bounds(&self, aabb: &Aabb<C>) -> Result<(), SpatialHashMapError>
    where
        C: nalgebra::Scalar,
    {
        if matches!(self.config.out_of_bounds, OutOfBoundsBehavior::Optimistic) {
            return Ok(());
        }

        // Convert AABB corners to cell coordinates and check if they're in bounds
        let min_cell_x = aabb.min.coords.x.get_cell_index(self.cell_x);
        let min_cell_y = aabb.min.coords.y.get_cell_index(self.cell_y);
        let max_cell_x = aabb.max.coords.x.get_cell_index(self.cell_x);
        let max_cell_y = aabb.max.coords.y.get_cell_index(self.cell_y);

        // Check all four cell coordinates
        if self.get_cell_idx(min_cell_x, min_cell_y).is_none()
            || self.get_cell_idx(max_cell_x, max_cell_y).is_none()
        {
            return Err(SpatialHashMapError::OutOfBounds {
                cells_x: self.cells_x,
                cells_y: self.cells_y,
            });
        }

        Ok(())
    }

    /// Get the spatial hash map specification for calculating cell intersections.
    fn get_spec(&self) -> SpatialHashMapSpec<C> {
        SpatialHashMapSpec {
            cell_width: self.cell_x,
            cell_height: self.cell_y,
        }
    }

    /// Get an immutable client reference for the given handle.
    pub fn get_client<'a>(
        &'a self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<Client<'a, C, D, T, R, <R as ReadRegistry<ClientData<D, T>>>::Handle>> {
        if self.client_registry.get(&handle.0).is_some() {
            Some(Client { map: self, handle })
        } else {
            None
        }
    }

    /// Get a mutable client reference for the given handle.
    pub fn get_client_mut<'a>(
        &'a mut self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<ClientMut<'a, C, D, T, R, <R as ReadRegistry<ClientData<D, T>>>::Handle>> {
        if self.client_registry.get(&handle.0).is_some() {
            Some(ClientMut { map: self, handle })
        } else {
            None
        }
    }

    /// Get a reference to the user data for the given handle.
    pub(super) fn get_data(
        &self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<&D> {
        self.client_registry.get(&handle.0).map(|cd| &cd.data)
    }

    /// Get a mutable reference to the user data for the given handle.
    pub(super) fn get_data_mut(
        &mut self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<&mut D> {
        self.client_registry
            .get_mut(&handle.0)
            .map(|cd| &mut cd.data)
    }

    /// Get a reference to the shape for the given handle.
    pub(super) fn get_shape(
        &self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<&T> {
        self.client_registry.get(&handle.0).map(|cd| &cd.shape)
    }

    /// Get the number of clients currently in the map.
    pub fn len(&self) -> usize {
        self.client_registry.len()
    }

    /// Check if the map is empty.
    pub fn is_empty(&self) -> bool {
        self.client_registry.is_empty()
    }
}

// Impl block for methods that require T: SpatialHashMapShape<C>
impl<C, D, T, R> SpatialHashMap<C, D, T, R>
where
    C: SpatialHashMapCoord + nalgebra::Scalar,
    T: SpatialHashMapShape<C>,
    R: ReadRegistry<ClientData<D, T>> + WriteRegistry<ClientData<D, T>>,
{
    /// Update the shape associated with a handle, moving it to the appropriate cells.
    ///
    /// This removes the handle from cells intersecting the old shape and adds it to cells
    /// intersecting the new shape. Returns the old shape if successful.
    pub fn update_shape(
        &mut self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
        new_shape: T,
    ) -> Result<Option<T>, SpatialHashMapError> {
        // Get the old shape; return early if handle is invalid
        let old_shape_data = match self.client_registry.get(&handle.0) {
            Some(s) => s,
            None => return Ok(None),
        };

        // Validate new shape's AABB bounds upfront (returns error in Fail mode if out of bounds)
        self.check_aabb_bounds(&new_shape.aabb())?;

        let spec = self.get_spec();

        // Remove from old cells
        // Note: No validation needed - if the shape was successfully inserted,
        // all its cells are guaranteed to be valid (or were skipped in Optimistic mode)
        for (cx, cy) in old_shape_data.shape.get_intersecting_cells(spec) {
            if let Some(cell_idx) = self.get_cell_idx(cx, cy) {
                self.cells[cell_idx].remove(&handle.0);
            }
        }

        // Add to new cells
        // In Fail mode: all cells should be valid (AABB check passed)
        // In Optimistic mode: skip out-of-bounds cells silently
        for (cx, cy) in new_shape.get_intersecting_cells(spec) {
            if let Some(cell_idx) = self.get_cell_idx(cx, cy) {
                self.cells[cell_idx].insert(handle.0);
            } else if matches!(self.config.out_of_bounds, OutOfBoundsBehavior::Fail) {
                // This should never happen if AABB check passed in Fail mode
                panic!(
                    "Cell ({:?}, {:?}) out of bounds despite AABB check passing. Grid: {}x{} cells",
                    cx, cy, self.cells_x, self.cells_y
                );
            }
            // In Optimistic mode, silently skip out-of-bounds cells
        }

        // Update the shape in the registry
        let client_data = self.client_registry.get_mut(&handle.0).unwrap();
        let old = std::mem::replace(&mut client_data.shape, new_shape);
        Ok(Some(old))
    }
}

// Impl block for methods that require T: SpatialHashMapShape<C> and removal
impl<C, D, T, R> SpatialHashMap<C, D, T, R>
where
    C: SpatialHashMapCoord + nalgebra::Scalar,
    T: SpatialHashMapShape<C>,
    R: ReadRegistry<ClientData<D, T>> + WriteRegistry<ClientData<D, T>>,
{
    /// Insert a shape and associated user data into the spatial hash map.
    ///
    /// Returns a ClientHandle that can be used to access or remove the data later.
    pub fn insert(
        &mut self,
        shape: T,
        data: D,
    ) -> Result<ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>, SpatialHashMapError>
    where
        <R as WriteRegistry<ClientData<D, T>>>::Handle:
            Into<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
        <R as ReadRegistry<ClientData<D, T>>>::Handle:
            From<<R as WriteRegistry<ClientData<D, T>>>::Handle>,
    {
        // Validate AABB bounds upfront (returns error in Fail mode if out of bounds)
        self.check_aabb_bounds(&shape.aabb())?;

        let spec = self.get_spec();

        let client_data = ClientData { data, shape };
        let registry_handle = self.client_registry.insert(client_data);
        let handle_copy: <R as ReadRegistry<ClientData<D, T>>>::Handle = registry_handle.into();

        // Add to all intersecting cells
        // In Fail mode: all cells should be valid (AABB check passed)
        // In Optimistic mode: skip out-of-bounds cells silently
        let client_data = self.client_registry.get(&handle_copy).unwrap();
        for (cx, cy) in client_data.shape.get_intersecting_cells(spec) {
            if let Some(cell_idx) = self.get_cell_idx(cx, cy) {
                self.cells[cell_idx].insert(handle_copy);
            } else if matches!(self.config.out_of_bounds, OutOfBoundsBehavior::Fail) {
                // This should never happen if AABB check passed in Fail mode
                panic!(
                    "Cell ({:?}, {:?}) out of bounds despite AABB check passing. Grid: {}x{} cells",
                    cx, cy, self.cells_x, self.cells_y
                );
            }
            // In Optimistic mode, silently skip out-of-bounds cells
        }

        Ok(ClientHandle(handle_copy))
    }

    /// Remove a client from the spatial hash map.
    ///
    /// Returns the user data if the handle was valid.
    pub(super) fn remove(
        &mut self,
        handle: ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    ) -> Option<D>
    where
        R: RemovableRegistry<ClientData<D, T>>,
        <R as ReadRegistry<ClientData<D, T>>>::Handle:
            Into<<R as RemovableRegistry<ClientData<D, T>>>::Handle>,
        <R as RemovableRegistry<ClientData<D, T>>>::Handle:
            Into<<R as ReadRegistry<ClientData<D, T>>>::Handle>,
    {
        let spec = self.get_spec();

        // Get the shape; return early if handle is invalid
        let shape_data = match self.client_registry.get(&handle.0) {
            Some(s) => s,
            None => return None,
        };

        // Remove from all cells
        // Note: No validation needed - if the shape was successfully inserted,
        // all its cells are guaranteed to be valid (or were skipped in Optimistic mode)
        for (cx, cy) in shape_data.shape.get_intersecting_cells(spec) {
            if let Some(cell_idx) = self.get_cell_idx(cx, cy) {
                self.cells[cell_idx].remove(&handle.0);
            }
        }

        // Remove from registry
        let client_data = self.client_registry.remove(&handle.0.into()).unwrap();

        Some(client_data.data)
    }

    /// Query the spatial hash map for shapes matching the query.
    ///
    /// Returns an iterator of ClientHandles for all matching shapes.
    /// Note: May return duplicate handles if shapes span multiple cells.
    /// Out-of-range query coordinates are silently ignored (they just don't match any cells).
    pub fn query<'a>(
        &'a self,
        query: &'a SpatialHashMapQuery<C>,
    ) -> impl Iterator<Item = ClientHandle<<R as ReadRegistry<ClientData<D, T>>>::Handle>> + 'a
    where
        C: PartialOrd
            + std::ops::Sub<Output = C>
            + std::ops::Add<Output = C>
            + std::ops::Mul<Output = C>
            + std::ops::Div<Output = C>
            + From<u8>,
    {
        let spec = self.get_spec();

        // Collect valid cell indices (out-of-range cells are silently skipped)
        let mut cell_indices = Vec::new();
        for (cx, cy) in query.get_query_cells(spec) {
            if let Some(cell_idx) = self.get_cell_idx(cx, cy) {
                cell_indices.push(cell_idx);
            }
        }

        cell_indices
            .into_iter()
            .flat_map(move |cell_idx| self.cells[cell_idx].iter())
            .filter_map(move |handle| {
                let client_data = self.client_registry.get(handle)?;
                if client_data.shape.matches_query(query) {
                    Some(ClientHandle(*handle))
                } else {
                    None
                }
            })
    }
}
