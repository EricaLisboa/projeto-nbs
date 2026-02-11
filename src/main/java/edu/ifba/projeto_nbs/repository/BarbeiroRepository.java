package edu.ifba.projeto_nbs.repository;

import edu.ifba.projeto_nbs.model.Barbeiro;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BarbeiroRepository extends JpaRepository<Barbeiro, Long> {
}
