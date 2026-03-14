package com.aquasmart.repository;

import com.aquasmart.model.DeviceReading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface DeviceReadingRepository extends JpaRepository<DeviceReading, Long> {
    List<DeviceReading> findByDeviceIdOrderByTimestampDesc(String deviceId);
}
