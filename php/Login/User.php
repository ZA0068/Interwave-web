<?php

class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $username;
    public $email;
    public $password;
    public $first_name;
    public $last_name;

    public function __construct($db) {
        $this->conn = $db;
    }

    // Register new user
    public function register() {
        $query = "INSERT INTO " . $this->table_name . " 
                 (username, email, password_hash, first_name, last_name) 
                 VALUES (:username, :email, :password_hash, :first_name, :last_name)";
        
        $stmt = $this->conn->prepare($query);
        
        // Hash password
        $password_hash = password_hash($this->password, PASSWORD_DEFAULT);
        
        // Bind values
        $stmt->bindParam(":username", $this->username);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":password_hash", $password_hash);
        $stmt->bindParam(":first_name", $this->first_name);
        $stmt->bindParam(":last_name", $this->last_name);
        
        try {
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return false;
        }
        return true;
    }

    // Check if user exists
    public function userExists() {
        $query = "SELECT id, username, password_hash 
                 FROM " . $this->table_name . " 
                 WHERE username = :username OR email = :username 
                 AND is_active = TRUE 
                 LIMIT 1";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":username", $this->username);
        try {
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
            return false;
        }
        
        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            $this->id = $row['id'];
            $this->username = $row['username'];
            $this->password_hash = $row['password_hash'];
            return true;
        }
        return false;
    }

    // Verify password
    public function verifyPassword($password) {
        return password_verify($password, $this->password_hash);
    }

    // Update last login
    public function updateLastLogin() {
        $query = "UPDATE " . $this->table_name . " 
                 SET last_login = CURRENT_TIMESTAMP 
                 WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $this->id);
        try {
            $stmt->execute();
        } catch (PDOException $e) {
            error_log("Database error: " . $e->getMessage());
        }
    }
}

?>