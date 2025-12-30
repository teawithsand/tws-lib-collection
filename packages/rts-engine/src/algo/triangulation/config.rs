/// Configuration for triangulation validation checks.
///
/// Controls which validation checks are performed during triangulation construction.
/// All checks are enabled by default (safe mode). Use `unchecked()` to disable all
/// checks for maximum performance when input validity is guaranteed.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub struct TriangulatorConfig {
    /// Check for duplicate points in the input.
    pub check_duplicate_points: bool,

    /// Check that all points are strictly contained within the supertriangle.
    pub check_strict_supertriangle_containment: bool,

    /// Check for duplicate constraints in CDT construction.
    pub check_duplicate_constraints: bool,

    /// Check for intersecting constraints in CDT construction.
    pub check_intersecting_constraints: bool,

    /// Check for constraints that pass through other vertices (collinearity).
    pub check_constraint_collinearity: bool,

    /// Validate that all constraints are present after CDT construction.
    pub check_post_constraint_validation: bool,

    /// Validate that no triangles with super-vertices remain after removal.
    /// Applies to both `build_delaunay()` and `build_cdt()` which remove the supertriangle.
    pub check_supertriangle_removal: bool,
}

impl TriangulatorConfig {
    /// Create a safe configuration with all checks enabled.
    ///
    /// This is the recommended configuration for most use cases and is equivalent to `Default::default()`.
    pub fn safe() -> Self {
        Self {
            check_duplicate_points: true,
            check_strict_supertriangle_containment: true,
            check_duplicate_constraints: true,
            check_intersecting_constraints: true,
            check_constraint_collinearity: true,
            check_post_constraint_validation: true,
            check_supertriangle_removal: true,
        }
    }

    /// Create an unchecked configuration with all checks disabled.
    ///
    /// Use this for maximum performance when you can guarantee input validity.
    /// Note: This is safe in terms of memory safety, but may produce incorrect
    /// results or panic if the input is invalid.
    pub fn unchecked() -> Self {
        Self {
            check_duplicate_points: false,
            check_strict_supertriangle_containment: false,
            check_duplicate_constraints: false,
            check_intersecting_constraints: false,
            check_constraint_collinearity: false,
            check_post_constraint_validation: false,
            check_supertriangle_removal: false,
        }
    }

    /// Set whether to check for duplicate points.
    pub fn with_duplicate_points_check(mut self, check: bool) -> Self {
        self.check_duplicate_points = check;
        self
    }

    /// Set whether to check strict supertriangle containment.
    pub fn with_strict_supertriangle_containment(mut self, check: bool) -> Self {
        self.check_strict_supertriangle_containment = check;
        self
    }

    /// Set whether to check for duplicate constraints.
    pub fn with_duplicate_constraints_check(mut self, check: bool) -> Self {
        self.check_duplicate_constraints = check;
        self
    }

    /// Set whether to check for intersecting constraints.
    pub fn with_intersecting_constraints_check(mut self, check: bool) -> Self {
        self.check_intersecting_constraints = check;
        self
    }

    /// Set whether to check for constraint collinearity.
    pub fn with_constraint_collinearity_check(mut self, check: bool) -> Self {
        self.check_constraint_collinearity = check;
        self
    }

    /// Set whether to perform post-constraint validation.
    pub fn with_post_constraint_validation(mut self, check: bool) -> Self {
        self.check_post_constraint_validation = check;
        self
    }

    /// Set whether to validate supertriangle removal.
    pub fn with_supertriangle_removal_check(mut self, check: bool) -> Self {
        self.check_supertriangle_removal = check;
        self
    }
}

impl Default for TriangulatorConfig {
    fn default() -> Self {
        Self::safe()
    }
}
