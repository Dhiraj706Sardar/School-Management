-- Add rate limiting table
CREATE TABLE IF NOT EXISTS rate_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_key VARCHAR(100) NOT NULL,
  endpoint VARCHAR(100) NOT NULL,
  count INT NOT NULL DEFAULT 1,
  first_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_attempt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY unique_client_endpoint (client_key, endpoint)
);

-- Add index for faster lookups
CREATE INDEX idx_rate_limit_lookup ON rate_limits (client_key, endpoint);

-- Cleanup procedure to remove old rate limit entries
DELIMITER //
CREATE PROCEDURE cleanup_old_rate_limits()
BEGIN
  DELETE FROM rate_limits 
  WHERE last_attempt < DATE_SUB(NOW(), INTERVAL 1 HOUR);
END //
DELIMITER ;

-- Create event to run cleanup hourly
CREATE EVENT IF NOT EXISTS cleanup_rate_limits_event
ON SCHEDULE EVERY 1 HOUR
DO CALL cleanup_old_rate_limits();
