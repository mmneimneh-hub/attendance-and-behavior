CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS academic_years (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE CHECK (name ~ '^\d{4}-\d{4}$'),
  is_active boolean NOT NULL DEFAULT false,
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (starts_on IS NULL OR ends_on IS NULL OR starts_on < ends_on)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_academic_year
  ON academic_years (is_active) WHERE is_active;

CREATE TABLE IF NOT EXISTS semesters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  semester_number smallint NOT NULL CHECK (semester_number IN (1, 2)),
  name_ar text NOT NULL,
  name_en text NOT NULL,
  starts_on date,
  ends_on date,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, semester_number),
  CHECK (starts_on IS NULL OR ends_on IS NULL OR starts_on < ends_on)
);

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id text PRIMARY KEY,
  email text NOT NULL UNIQUE,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'principal', 'teacher', 'supervisor')),
  programs text[] NOT NULL DEFAULT ARRAY['national','international']::text[],
  grade_levels text[] NOT NULL DEFAULT ARRAY['4','5','6','7','8','9','10','11','12']::text[],
  section_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS staff_invites (
  email text PRIMARY KEY,
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'principal', 'teacher', 'supervisor')),
  programs text[] NOT NULL DEFAULT ARRAY['national','international']::text[],
  grade_levels text[] NOT NULL DEFAULT ARRAY['4','5','6','7','8','9','10','11','12']::text[],
  section_permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  code text NOT NULL,
  name_ar text NOT NULL,
  name_en text,
  program text NOT NULL DEFAULT 'national' CHECK (program IN ('national','international')),
  grade_level text NOT NULL DEFAULT '4' CHECK (grade_level IN ('4','5','6','7','8','9','10','11','12')),
  teacher_user_id text REFERENCES staff_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, code)
);

CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  class_id uuid REFERENCES classes(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  school_id text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (academic_year_id, class_id, full_name)
);

CREATE TABLE IF NOT EXISTS attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  academic_year_id uuid NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
  semester_id uuid NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
  class_id uuid NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  attendance_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('present', 'absent', 'early')),
  note text,
  recorded_by text REFERENCES staff_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (semester_id, student_id, attendance_date)
);

CREATE INDEX IF NOT EXISTS attendance_by_date_class
  ON attendance_records (attendance_date, class_id);
CREATE INDEX IF NOT EXISTS attendance_by_student
  ON attendance_records (student_id, attendance_date);

CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_record_id uuid REFERENCES attendance_records(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  method text NOT NULL CHECK (method IN ('SMS', 'WhatsApp', 'Email')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
  sent_at timestamptz,
  created_by text REFERENCES staff_profiles(user_id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS school_settings (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  school_name_ar text NOT NULL DEFAULT 'مدارس نجد الأهلية',
  school_name_en text NOT NULL DEFAULT 'Najd National Schools',
  school_logo text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO school_settings (singleton)
VALUES (true)
ON CONFLICT (singleton) DO NOTHING;

CREATE TABLE IF NOT EXISTS school_state (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  data jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by text
);
