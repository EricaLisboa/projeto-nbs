package edu.ifba.projeto_nbs.controller;

import edu.ifba.projeto_nbs.model.Barbeiro;
import edu.ifba.projeto_nbs.repository.BarbeiroRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/barbeiros")
public class BarbeiroController {

    private final BarbeiroRepository repo;

    public BarbeiroController(BarbeiroRepository repo) {
        this.repo = repo;
    }

    @GetMapping
    public List<Barbeiro> listar() {
        return repo.findAll();
    }

    @PostMapping
    public Barbeiro cadastrar(@RequestBody Barbeiro barbeiro) {
        return repo.save(barbeiro);
    }
}

