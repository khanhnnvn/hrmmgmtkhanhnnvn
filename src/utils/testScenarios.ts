export interface TestScenario {
  name: string;
  description: string;
  steps: string[];
  expectedResult: string;
  category: 'workflow' | 'validation' | 'permission' | 'performance';
}

export interface ValidationTestCase {
  field: string;
  invalidInputs: Array<{
    value: any;
    expectedError: string;
  }>;
  validInputs: any[];
}

export interface PermissionTestCase {
  role: 'ADMIN' | 'HR' | 'EMPLOYEE' | 'GUEST';
  allowedRoutes: string[];
  deniedRoutes: string[];
  allowedActions: string[];
  deniedActions: string[];
}

export interface UsernameTestCase {
  fullName: string;
  existingUsernames: string[];
  expectedUsername: string;
}

export class RecruitmentTestScenarios {
  static async testFullRecruitmentWorkflow(): Promise<TestScenario[]> {
    return [
      {
        name: 'Complete Candidate Journey',
        description: 'Test full workflow from application to hire',
        category: 'workflow',
        steps: [
          '1. Candidate submits application via /apply',
          '2. HR reviews application and updates status to APPROVED',
          '3. HR creates interview session with multiple interviewers',
          '4. Each interviewer completes their evaluation',
          '5. HR makes final decision (HIRE/NO_HIRE)',
          '6. If HIRE, create user account and employee record'
        ],
        expectedResult: 'Candidate status should be HIRED and employee record created'
      },
      {
        name: 'Multi-interviewer Assessment',
        description: 'Test interview process with multiple evaluators',
        category: 'workflow',
        steps: [
          '1. Create interview session for approved candidate',
          '2. Assign 3 interviewers to session',
          '3. Each interviewer logs in and completes evaluation',
          '4. Verify all evaluations are recorded correctly',
          '5. Check session progress tracking'
        ],
        expectedResult: 'All interviews completed, progress shows 100%'
      },
      {
        name: 'Role-based Access Control',
        description: 'Verify proper permission enforcement',
        category: 'permission',
        steps: [
          '1. Test ADMIN access to all features',
          '2. Test HR access (no dashboard, can manage candidates)',
          '3. Test EMPLOYEE access (only personal data and assigned interviews)',
          '4. Test GUEST access (only application form)'
        ],
        expectedResult: 'Each role can only access authorized features'
      },
      {
        name: 'Form Validation Comprehensive Test',
        description: 'Test all form validations across the system',
        category: 'validation',
        steps: [
          '1. Test candidate application form validation',
          '2. Test user creation form validation',
          '3. Test interview evaluation form validation',
          '4. Test employee profile form validation',
          '5. Test Vietnamese name to username conversion'
        ],
        expectedResult: 'All invalid inputs rejected with proper error messages'
      },
      {
        name: 'Database Integrity and Security',
        description: 'Test RLS policies and data consistency',
        category: 'permission',
        steps: [
          '1. Verify users can only see authorized data',
          '2. Test duplicate email/username prevention',
          '3. Test foreign key constraints',
          '4. Test RLS policy enforcement',
          '5. Test audit logging functionality'
        ],
        expectedResult: 'Data integrity maintained, unauthorized access blocked'
      },
      {
        name: 'Bulk Operations Performance',
        description: 'Test system performance with multiple operations',
        category: 'performance',
        steps: [
          '1. Create 50+ candidates using auto-form filler',
          '2. Bulk approve multiple candidates',
          '3. Create interview sessions for all approved candidates',
          '4. Test dashboard statistics calculation',
          '5. Test pagination and filtering performance'
        ],
        expectedResult: 'System remains responsive, operations complete successfully'
      }
    ];
  }

  static getValidationTestCases(): ValidationTestCase[] {
    return [
      {
        field: 'email',
        invalidInputs: [
          { value: 'invalid-email', expectedError: 'Email không hợp lệ' },
          { value: 'test@', expectedError: 'Email không hợp lệ' },
          { value: '@domain.com', expectedError: 'Email không hợp lệ' },
          { value: '', expectedError: 'Required' }
        ],
        validInputs: ['test@example.com', 'user.name@company.co.vn']
      },
      {
        field: 'phone',
        invalidInputs: [
          { value: '123', expectedError: 'Số điện thoại phải từ 9-12 số' },
          { value: '1234567890123', expectedError: 'Số điện thoại phải từ 9-12 số' },
          { value: 'abc123456789', expectedError: 'Số điện thoại phải từ 9-12 số' },
          { value: '', expectedError: 'Required' }
        ],
        validInputs: ['0912345678', '0123456789', '841234567890']
      },
      {
        field: 'full_name',
        invalidInputs: [
          { value: 'A', expectedError: 'Họ và tên phải có ít nhất 2 ký tự' },
          { value: '', expectedError: 'Required' }
        ],
        validInputs: ['Nguyễn Văn A', 'Trần Thị Bình', 'Lê Hoàng Cường']
      },
      {
        field: 'national_id',
        invalidInputs: [
          { value: '123', expectedError: 'Căn cước công dân phải có đúng 12 số' },
          { value: '12345678901a', expectedError: 'Căn cước công dân phải có đúng 12 số' },
          { value: '1234567890123', expectedError: 'Căn cước công dân phải có đúng 12 số' }
        ],
        validInputs: ['123456789012', '987654321098']
      }
    ];
  }

  static getPermissionTestCases(): PermissionTestCase[] {
    return [
      {
        role: 'ADMIN',
        allowedRoutes: ['/dashboard', '/candidates', '/interviews', '/users', '/candidates/:id'],
        deniedRoutes: ['/employee', '/employee/profile', '/employee/interviews'],
        allowedActions: ['create_user', 'delete_user', 'view_all_candidates', 'manage_positions', 'view_statistics'],
        deniedActions: []
      },
      {
        role: 'HR',
        allowedRoutes: ['/candidates', '/interviews', '/users', '/candidates/:id'],
        deniedRoutes: ['/dashboard', '/employee', '/employee/profile', '/employee/interviews'],
        allowedActions: ['view_all_candidates', 'manage_interviews', 'create_users', 'make_decisions'],
        deniedActions: ['delete_users', 'view_statistics', 'manage_positions']
      },
      {
        role: 'EMPLOYEE',
        allowedRoutes: ['/employee', '/employee/profile', '/employee/interviews'],
        deniedRoutes: ['/dashboard', '/candidates', '/interviews', '/users'],
        allowedActions: ['view_own_profile', 'update_own_profile', 'complete_assigned_interviews'],
        deniedActions: ['view_all_candidates', 'create_users', 'make_decisions', 'manage_interviews']
      },
      {
        role: 'GUEST',
        allowedRoutes: ['/apply', '/login'],
        deniedRoutes: ['/dashboard', '/candidates', '/interviews', '/users', '/employee'],
        allowedActions: ['submit_application'],
        deniedActions: ['view_candidates', 'create_users', 'manage_data']
      }
    ];
  }

  static getUsernameGenerationTestCases(): UsernameTestCase[] {
    return [
      {
        fullName: 'Nguyễn Văn An',
        existingUsernames: [],
        expectedUsername: 'nguyenvanan'
      },
      {
        fullName: 'Trần Thị Bình',
        existingUsernames: ['tranthibinh'],
        expectedUsername: 'tranthibinh1'
      },
      {
        fullName: 'Lê Hoàng Cường',
        existingUsernames: ['lehoangcuong', 'lehoangcuong1'],
        expectedUsername: 'lehoangcuong2'
      },
      {
        fullName: 'Phạm Đức Minh',
        existingUsernames: [],
        expectedUsername: 'phamducminh'
      },
      {
        fullName: 'Vũ Thị Hằng',
        existingUsernames: [],
        expectedUsername: 'vuthihang'
      }
    ];
  }

  // Console testing functions
  static async runConsoleTests(): Promise<void> {
    console.log('🚀 Starting Recruitment System Tests...\n');

    // Test 1: Validation Tests
    console.log('📋 Running Validation Tests...');
    const validationTests = this.getValidationTestCases();
    validationTests.forEach(test => {
      console.log(`  ✓ Testing ${test.field} validation`);
      test.invalidInputs.forEach(invalid => {
        console.log(`    ❌ "${invalid.value}" should show: "${invalid.expectedError}"`);
      });
      test.validInputs.forEach(valid => {
        console.log(`    ✅ "${valid}" should be accepted`);
      });
    });

    // Test 2: Permission Tests
    console.log('\n🔒 Running Permission Tests...');
    const permissionTests = this.getPermissionTestCases();
    permissionTests.forEach(test => {
      console.log(`  ✓ Testing ${test.role} permissions`);
      console.log(`    Allowed routes: ${test.allowedRoutes.join(', ')}`);
      console.log(`    Denied routes: ${test.deniedRoutes.join(', ')}`);
    });

    // Test 3: Username Generation Tests
    console.log('\n👤 Running Username Generation Tests...');
    const usernameTests = this.getUsernameGenerationTestCases();
    usernameTests.forEach(test => {
      console.log(`  ✓ "${test.fullName}" -> "${test.expectedUsername}"`);
    });

    // Test 4: Workflow Tests
    console.log('\n🔄 Running Workflow Tests...');
    const workflowTests = await this.testFullRecruitmentWorkflow();
    workflowTests.forEach(test => {
      console.log(`  ✓ ${test.name}`);
      console.log(`    ${test.description}`);
    });

    console.log('\n✨ All tests defined. Run individual test scenarios to execute them.');
    console.log('\nAvailable console commands:');
    console.log('- autoFormFiller.runAutoFormFiller(positions)');
    console.log('- autoFormFiller.checkFormStatus()');
    console.log('- RecruitmentTestScenarios.runConsoleTests()');
  }
}

// Make available globally for console access
declare global {
  interface Window {
    RecruitmentTestScenarios: typeof RecruitmentTestScenarios;
  }
}

if (typeof window !== 'undefined') {
  window.RecruitmentTestScenarios = RecruitmentTestScenarios;
}