-- Railway Database Setup Script
-- Run this in Railway MySQL console or via CLI

-- Create schools table
CREATE TABLE IF NOT EXISTS schools (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  contact VARCHAR(15) NOT NULL,
  email_id VARCHAR(255) NOT NULL,
  image VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Add indexes for better performance
CREATE INDEX idx_city ON schools(city);
CREATE INDEX idx_state ON schools(state);
CREATE INDEX idx_email ON schools(email_id);

-- Insert sample data (optional)
INSERT INTO schools (name, address, city, state, contact, email_id) VALUES
('Sample High School', '123 Education Street', 'New York', 'NY', '1234567890', 'info@samplehigh.edu'),
('Tech Academy', '456 Innovation Ave', 'San Francisco', 'CA', '9876543210', 'contact@techacademy.edu');