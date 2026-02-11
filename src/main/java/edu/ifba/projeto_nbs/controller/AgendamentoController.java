package edu.ifba.projeto_nbs.controller;

import edu.ifba.projeto_nbs.model.Agendamento;
import edu.ifba.projeto_nbs.repository.AgendamentoRepository;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/agendamentos")
public class AgendamentoController {

    private final AgendamentoRepository repo;

    public AgendamentoController(AgendamentoRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Agendamento> listar() {
        return repo.findAll();
    }

    @PostMapping
    public Agendamento criar(@RequestBody Agendamento agendamento) {
    if (agendamento.getCliente() == null || agendamento.getBarbeiro() == null) {
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cliente e barbeiro são obrigatórios");
    }
    return repo.save(agendamento);
    }

    @GetMapping("/{id}")
    public Agendamento buscarPorId(@PathVariable Long id) {
        return repo.findById(id).orElse(null);
    }
}

