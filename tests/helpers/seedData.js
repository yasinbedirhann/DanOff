// Shared test fixtures — 9 employees (3 entities × 3 roles) and sample leave requests.
// Passwords are placeholder bcrypt hashes; bcrypt is mocked in test files that use this data.
const HASHED_PW = '$2b$10$NKvLgqYBR8ZJFrHPBFJFIu4a6Gm8K5RG1KHJ8aB3mRoLdQwE3bKqa';

const employees = {
    // --- Federacija BiH ---
    employee_fbih: {
        id: 1, first_name: 'Amar', last_name: 'Hodžić',
        email: 'amar@danoff.ba', password: HASHED_PW,
        role: 'employee', position: 'Developer', entity: 'fbih', salary: 2500, phone: '+38761111111'
    },
    manager_fbih: {
        id: 2, first_name: 'Emina', last_name: 'Hadžić',
        email: 'emina@danoff.ba', password: HASHED_PW,
        role: 'manager', position: 'Team Lead', entity: 'fbih', salary: 3500, phone: '+38761222222'
    },
    admin_fbih: {
        id: 3, first_name: 'Admin', last_name: 'Sistem',
        email: 'admin@danoff.ba', password: HASHED_PW,
        role: 'admin', position: 'Administrator', entity: 'fbih', salary: 5000, phone: '+38761333333'
    },

    // --- Republika Srpska ---
    employee_rs: {
        id: 4, first_name: 'Milena', last_name: 'Stanić',
        email: 'milena@danoff.ba', password: HASHED_PW,
        role: 'employee', position: 'Analyst', entity: 'rs', salary: 2200, phone: '+38765444444'
    },
    manager_rs: {
        id: 5, first_name: 'Dragan', last_name: 'Marković',
        email: 'dragan@danoff.ba', password: HASHED_PW,
        role: 'manager', position: 'Department Head', entity: 'rs', salary: 4000, phone: '+38765555555'
    },
    admin_rs: {
        id: 6, first_name: 'Sanja', last_name: 'Jović',
        email: 'sanja@danoff.ba', password: HASHED_PW,
        role: 'admin', position: 'Administrator', entity: 'rs', salary: 4800, phone: '+38765666666'
    },

    // --- Brčko Distrikt ---
    employee_brcko: {
        id: 7, first_name: 'Lejla', last_name: 'Begić',
        email: 'lejla@danoff.ba', password: HASHED_PW,
        role: 'employee', position: 'HR Specialist', entity: 'brcko', salary: 2300, phone: '+38761777777'
    },
    manager_brcko: {
        id: 8, first_name: 'Nermin', last_name: 'Selimović',
        email: 'nermin@danoff.ba', password: HASHED_PW,
        role: 'manager', position: 'Operations Manager', entity: 'brcko', salary: 3800, phone: '+38761888888'
    },
    admin_brcko: {
        id: 9, first_name: 'Amila', last_name: 'Kadić',
        email: 'amila@danoff.ba', password: HASHED_PW,
        role: 'admin', position: 'Administrator', entity: 'brcko', salary: 5000, phone: '+38761999999'
    }
};

const leaveRequests = {
    pending_annual: {
        id: 1, employee_id: 1,
        leave_type: 'annual', start_date: '2026-07-01', end_date: '2026-07-08', days: 6,
        status: 'pending', notes: '', approved_by: null,
        first_name: 'Amar', last_name: 'Hodžić', position: 'Developer'
    },
    approved_annual: {
        id: 2, employee_id: 1,
        leave_type: 'annual', start_date: '2026-06-01', end_date: '2026-06-05', days: 5,
        status: 'approved', notes: '', approved_by: 2,
        first_name: 'Amar', last_name: 'Hodžić', position: 'Developer'
    },
    pending_sick_rs: {
        id: 3, employee_id: 4,
        leave_type: 'sick', start_date: '2026-07-15', end_date: '2026-07-17', days: 3,
        status: 'pending', notes: 'Medical appointment', approved_by: null,
        first_name: 'Milena', last_name: 'Stanić', position: 'Analyst'
    }
};

module.exports = { employees, leaveRequests };
