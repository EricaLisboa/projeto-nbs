package edu.ifba.projeto_nbs.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import edu.ifba.projeto_nbs.model.Cliente;

public interface ClienteRepository extends JpaRepository<Cliente, Long> {

}
