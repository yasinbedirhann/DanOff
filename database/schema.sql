CREATE TABLE employees (
    id          SERIAL PRIMARY KEY,
    first_name  VARCHAR(100) NOT NULL,
    last_name   VARCHAR(100) NOT NULL,
    email       VARCHAR(150) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20) DEFAULT 'employee',
    position    VARCHAR(100),
    entity      VARCHAR(20) DEFAULT 'fbih',
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE leave_requests (
    id           SERIAL PRIMARY KEY,
    employee_id  INT REFERENCES employees(id),
    leave_type   VARCHAR(20) NOT NULL,
    start_date   DATE NOT NULL,
    end_date     DATE NOT NULL,
    days         INT NOT NULL,
    status       VARCHAR(20) DEFAULT 'pending',
    notes        TEXT,
    approved_by  INT REFERENCES employees(id),
    created_at   TIMESTAMP DEFAULT NOW()
);
