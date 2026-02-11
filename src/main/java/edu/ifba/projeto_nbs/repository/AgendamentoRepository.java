package edu.ifba.projeto_nbs.repository;

import edu.ifba.projeto_nbs.model.Agendamento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {
}
