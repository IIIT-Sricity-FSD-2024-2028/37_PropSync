CREATE DATABASE PropSync; 
USE PropSync; 
 
 1.Administrator 
CREATE TABLE Administrator ( 
    admin_id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(150) UNIQUE NOT NULL, 
    community_name VARCHAR(150), 
    password VARCHAR(255) NOT NULL 
); 
 
  2.Users 
CREATE TABLE Users ( 
    user_id INT AUTO_INCREMENT PRIMARY KEY, 
    name VARCHAR(100) NOT NULL, 
    email VARCHAR(150) UNIQUE NOT NULL, 
    phone VARCHAR(20), 
    password VARCHAR(255) NOT NULL, 
    admin_id INT, 
    CONSTRAINT fk_users_admin FOREIGN KEY (admin_id) REFERENCES 
Administrator(admin_id) 
); 
 
 3.Maintenance_Manager 
CREATE TABLE Maintenance_Manager ( 
    manager_id INT PRIMARY KEY, 
    community_name VARCHAR(150), 
    CONSTRAINT fk_manager_user FOREIGN KEY (manager_id) REFERENCES 
Users(user_id) 
); 
 
 4.Owner 
CREATE TABLE Owner ( 
    owner_id INT PRIMARY KEY, 
    community_name VARCHAR(150), 
    property_unit VARCHAR(50) NOT NULL, 
 
    CONSTRAINT fk_owner_user FOREIGN KEY (owner_id) REFERENCES Users(user_id) 
); 
 
 5.Service_Provider 
CREATE TABLE Service_Provider ( 
    provider_id INT PRIMARY KEY, 
    category VARCHAR(100) NOT NULL, 
    CONSTRAINT fk_provider_user FOREIGN KEY (provider_id) REFERENCES Users(user_id) 
); 
 
 6.Complaint 
CREATE TABLE Complaint ( 
    complaint_id INT AUTO_INCREMENT PRIMARY KEY, 
    owner_id INT NOT NULL, 
    manager_id INT NOT NULL, 
    category VARCHAR(100), 
    description VARCHAR(500), 
    photo VARCHAR(255), 
    status VARCHAR(50) DEFAULT 'Pending', 
    date DATE NOT NULL, 
    CONSTRAINT fk_complaint_owner FOREIGN KEY (owner_id) REFERENCES 
Owner(owner_id), 
    CONSTRAINT fk_complaint_manager FOREIGN KEY (manager_id) REFERENCES 
Maintenance_Manager(manager_id) 
); 
 
 7.Service_Assignment 
CREATE TABLE Service_Assignment ( 
    assignment_id INT AUTO_INCREMENT PRIMARY KEY, 
    complaint_id INT NOT NULL, 
    provider_id INT NOT NULL, 
    manager_id INT NOT NULL, 
    due_date DATE, 
    CONSTRAINT fk_assign_complaint FOREIGN KEY (complaint_id) REFERENCES 
Complaint(complaint_id), 
    CONSTRAINT fk_assign_provider FOREIGN KEY (provider_id) REFERENCES 
Service_Provider(provider_id), 
    CONSTRAINT fk_assign_manager FOREIGN KEY (manager_id) REFERENCES 
Maintenance_Manager(manager_id) 
); 
 
 8.Service_Estimate 
CREATE TABLE Service_Estimate ( 
    assignment_id INT PRIMARY KEY, 
    estimated_cost DECIMAL(10, 2) NOT NULL, 
    date DATE, 
    CONSTRAINT fk_estimate_assignment FOREIGN KEY (assignment_id) REFERENCES 
Service_Assignment(assignment_id) 
); 
 
 9.Rating 
CREATE TABLE Rating ( 
    owner_id INT NOT NULL, 
    complaint_id INT NOT NULL, 
    score INT CHECK (score BETWEEN 1 AND 5), 
    feedback VARCHAR(500), 
    date DATE, 
    PRIMARY KEY (owner_id, complaint_id), 
    CONSTRAINT fk_rating_owner FOREIGN KEY (owner_id) REFERENCES Owner(owner_id), 
    CONSTRAINT fk_rating_complaint FOREIGN KEY (complaint_id) REFERENCES 
Complaint(complaint_id) 
); 
 
 10.Service_Bill 
CREATE TABLE Service_Bill ( 
    bill_id INT AUTO_INCREMENT PRIMARY KEY, 
    complaint_id INT NOT NULL, 
    amount DECIMAL(10, 2) NOT NULL, 
    penalty DECIMAL(10, 2) DEFAULT 0.00, 
    date DATE, 
    CONSTRAINT fk_bill_complaint FOREIGN KEY (complaint_id) REFERENCES 
Complaint(complaint_id) 
); 
 
 11.Payment 
CREATE TABLE Payment ( 
    payment_id INT AUTO_INCREMENT PRIMARY KEY, 
    bill_id INT NOT NULL, 
    amount DECIMAL(10, 2) NOT NULL, 
    payment_date DATE, 
    CONSTRAINT fk_payment_bill FOREIGN KEY (bill_id) REFERENCES Service_Bill(bill_id) 
); 
 
 12.Maintenance_Cost_Payment 
CREATE TABLE Maintenance_Cost_Payment ( 
    maintenance_id INT AUTO_INCREMENT PRIMARY KEY, 
    owner_id INT NOT NULL, 
    manager_id INT NOT NULL, 
    month VARCHAR(20), 
    maintenance_amount DECIMAL(10, 2) NOT NULL, 
    CONSTRAINT fk_mcp_owner FOREIGN KEY (owner_id) REFERENCES Owner(owner_id), 
    CONSTRAINT fk_mcp_manager FOREIGN KEY (manager_id) REFERENCES 
Maintenance_Manager(manager_id) 
); 
 
 13.Notification 
CREATE TABLE Notification ( 
    notification_id INT AUTO_INCREMENT PRIMARY KEY, 
    user_id INT NOT NULL, 
    complaint_id INT, 
    message VARCHAR(500) NOT NULL, 
    type VARCHAR(50), 
    status VARCHAR(20), 
    date_time DATETIME DEFAULT CURRENT_TIMESTAMP, 
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES Users(user_id), 
    CONSTRAINT fk_notif_complaint FOREIGN KEY (complaint_id) REFERENCES 
Complaint(complaint_id) 
); 
