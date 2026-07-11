package org.eliejesresce.k2;

import java.util.Optional;

public final class SubmissionService {
    private static final int MAX_RETRIES = 3;

    public Optional<String> findName(String identifier) {
        if (identifier == null || identifier.isBlank()) {
            return Optional.empty();
        }

        return Optional.of(identifier.trim());
    }
}