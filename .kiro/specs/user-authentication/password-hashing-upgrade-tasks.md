# Implementation Plan: Password Hashing Upgrade

- [ ] 1. Install argon2 dependency
  - Add argon2 package to project dependencies
  - Verify installation and compatibility
  - _Requirements: 2.1_

- [ ] 2. Implement hash format detection
  - [ ] 2.1 Create HashFormat enum
    - Define BTOA, ARGON2, and UNKNOWN formats
    - _Requirements: 5.1_

  - [ ] 2.2 Implement detectHashFormat function
    - Check for $argon2 prefix for argon2 hashes
    - Check for base64 pattern for btoa hashes
    - Return UNKNOWN for unrecognized formats
    - _Requirements: 5.1, 6.4_

  - [ ]* 2.3 Write property test for argon2 format detection
    - **Property 4: Hash format detection correctly identifies argon2 hashes**
    - **Validates: Requirements 6.4**

  - [ ]* 2.4 Write property test for btoa format detection
    - **Property 5: Hash format detection correctly identifies btoa hashes**
    - **Validates: Requirements 6.4**

- [ ] 3. Implement argon2 hashing functions
  - [ ] 3.1 Define ARGON2_CONFIG constant
    - Set type to argon2id
    - Set memoryCost to 65536 (64 MiB)
    - Set timeCost to 3 iterations
    - Set parallelism to 4 threads
    - Set hashLength to 32 bytes
    - Add documentation comments explaining parameter choices
    - _Requirements: 1.1, 1.3, 1.4, 1.5, 8.1_

  - [ ] 3.2 Implement hashPasswordArgon2 function
    - Import argon2 library dynamically
    - Call argon2.hash with configured parameters
    - Return promise resolving to hash string
    - Handle errors gracefully
    - _Requirements: 1.1, 1.2, 2.2, 8.1_

  - [ ]* 3.3 Write property test for argon2 hash generation
    - **Property 1: Argon2 hash generation produces valid hashes**
    - **Validates: Requirements 1.1**

  - [ ] 3.4 Implement verifyPasswordArgon2 function
    - Import argon2 library dynamically
    - Call argon2.verify with password and hash
    - Return promise resolving to boolean
    - Handle errors and return false on failure
    - _Requirements: 2.2_

  - [ ]* 3.5 Write property test for argon2 correct password verification
    - **Property 2: Argon2 verification accepts correct passwords**
    - **Validates: Requirements 6.2**

  - [ ]* 3.6 Write property test for argon2 incorrect password rejection
    - **Property 3: Argon2 verification rejects incorrect passwords**
    - **Validates: Requirements 6.3**

- [ ] 4. Refactor legacy btoa functions
  - [ ] 4.1 Rename hashPassword to hashPasswordBtoa
    - Keep existing implementation
    - Mark as deprecated in comments
    - _Requirements: 5.2_

  - [ ] 4.2 Create verifyPasswordBtoa function
    - Extract btoa verification logic
    - Keep existing comparison logic
    - Mark as deprecated in comments
    - _Requirements: 5.2_

- [ ] 5. Implement unified password interface
  - [ ] 5.1 Update hashPassword to use argon2
    - Make function async
    - Delegate to hashPasswordArgon2
    - Add documentation about async change
    - _Requirements: 1.1, 3.1_

  - [ ] 5.2 Update comparePassword to handle both formats
    - Make function async
    - Detect hash format using detectHashFormat
    - Delegate to appropriate verification function
    - Return object with match and needsUpgrade flags
    - Add documentation about format detection
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 8.2_

- [ ] 6. Implement migration functionality
  - [ ] 6.1 Create migrateDefaultUsers function
    - Check each default user's hash format
    - Store plaintext passwords for migration only
    - Hash plaintext passwords with argon2
    - Update DEFAULT_USERS array
    - Log migration progress
    - Add security documentation about plaintext handling
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 7.1, 8.3_

  - [ ]* 6.2 Write unit tests for migration
    - Test detection of btoa hashes
    - Test conversion to argon2
    - Test preservation of password functionality
    - Test error handling

- [ ] 7. Update login function
  - [ ] 7.1 Update login to use async comparePassword
    - Update password comparison to use new async API
    - Destructure match and needsUpgrade from result
    - Add automatic hash upgrade logic
    - Log upgrade events
    - Ensure error handling works with async operations
    - _Requirements: 3.1, 3.2, 3.3, 5.4_

  - [ ]* 7.2 Write property test for hash upgrade on login
    - **Property 6: Btoa hashes are upgraded after successful verification**
    - **Validates: Requirements 5.4, 6.5**

  - [ ]* 7.3 Write property test for authentication performance
    - **Property 7: Authentication time remains acceptable**
    - **Validates: Requirements 3.2**

- [ ] 8. Update existing tests
  - [ ] 8.1 Update authPassword.test.ts
    - Make all test functions async
    - Update hashPassword calls to await
    - Update comparePassword calls to await and destructure result
    - Update assertions to handle async operations
    - _Requirements: 6.1, 6.2, 6.3_

  - [ ] 8.2 Update authService.integration.test.ts if exists
    - Update login tests to handle async hashing
    - Update session tests to handle async operations
    - Verify migration works in integration context

- [ ] 9. Add error handling and logging
  - [ ] 9.1 Implement Argon2Error class
    - Create custom error class for argon2 failures
    - Include original error for debugging
    - _Requirements: 2.2_

  - [ ] 9.2 Add error handling wrappers
    - Wrap hashPasswordArgon2 with try-catch
    - Wrap verifyPasswordArgon2 with try-catch
    - Wrap migrateDefaultUsers with try-catch
    - Log errors without exposing sensitive data
    - _Requirements: 2.2, 2.3, 7.2, 7.3, 7.4_

  - [ ] 9.3 Add security logging guards
    - Audit all console.log statements
    - Ensure no plaintext passwords are logged
    - Ensure no sensitive data in error messages
    - _Requirements: 7.2, 7.3, 7.4_

- [ ] 10. Integrate migration into application startup
  - [ ] 10.1 Call migrateDefaultUsers on app initialization
    - Import migration function in App.tsx or index.tsx
    - Call migration before rendering auth provider
    - Handle migration errors gracefully
    - Log migration status
    - _Requirements: 4.1, 4.2_

  - [ ]* 10.2 Write integration test for startup migration
    - Test migration runs on app start
    - Test app continues if migration fails
    - Test all users can login after migration

- [ ] 11. Update documentation
  - [ ] 11.1 Add code comments for argon2 configuration
    - Document parameter choices
    - Reference OWASP guidelines
    - Explain security rationale
    - _Requirements: 8.1, 8.4_

  - [ ] 11.2 Add code comments for migration strategy
    - Document automatic upgrade process
    - Explain backward compatibility
    - Document error handling approach
    - _Requirements: 8.2, 8.3_

  - [ ] 11.3 Update README.md
    - Document argon2 usage
    - Explain automatic migration
    - Note performance characteristics
    - Add security best practices section
    - _Requirements: 8.4_

- [ ] 12. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Final validation and cleanup
  - [ ] 13.1 Verify all default users can login
    - Test login with each default user
    - Verify session creation works
    - Verify hash format is argon2 after login
    - _Requirements: 3.1, 3.2, 4.4_

  - [ ] 13.2 Verify migration works correctly
    - Start with btoa hashes
    - Run migration
    - Verify all hashes converted
    - Verify login still works
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [ ] 13.3 Performance testing
    - Measure login time with argon2
    - Verify within 2 second requirement
    - Test with multiple concurrent logins
    - _Requirements: 3.2_

  - [ ] 13.4 Security audit
    - Verify no plaintext passwords in logs
    - Verify no plaintext passwords in storage
    - Verify error messages don't expose sensitive data
    - Verify hash parameters meet security requirements
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 1.3, 1.4, 1.5_

- [ ] 14. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
