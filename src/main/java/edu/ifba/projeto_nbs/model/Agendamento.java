package edu.ifba.projeto_nbs.model;

import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalTime;

@Entity
@Table(
    name = "agendamentos",
    uniqueConstraints = @UniqueConstraint(columnNames = {"data", "hora", "barbeiro_id"})
)
public class Agendamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate data;
    private LocalTime hora;

    @Enumerated(EnumType.STRING)
    private StatusAgendamento status = StatusAgendamento.PENDENTE;

    @ManyToOne
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne
    @JoinColumn(name = "barbeiro_id", nullable = false)
    private Barbeiro barbeiro;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }

    public LocalTime getHora() { return hora; }
    public void setHora(LocalTime hora) { this.hora = hora; }

    public StatusAgendamento getStatus() { return status; }
    public void setStatus(StatusAgendamento status) { this.status = status; }

    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }

    public Barbeiro getBarbeiro() { return barbeiro; }
    public void setBarbeiro(Barbeiro barbeiro) { this.barbeiro = barbeiro; }
}
