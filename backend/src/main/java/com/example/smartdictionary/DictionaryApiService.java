package com.example.smartdictionary;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class DictionaryApiService {

    private static final String BASE_URL = "https://api.dictionaryapi.dev/api/v2/entries/en/";
    private final HttpClient httpClient = HttpClient.newHttpClient();

    /**
     * Fetch raw JSON from dictionaryapi.dev for the given word.
     * Returns null on error.
     */
    public String fetchRawJson(String word) {
        if (word == null || word.isBlank()) return null;
        String url = BASE_URL + word.toLowerCase();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .GET()
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return response.body();
            }
        } catch (IOException | InterruptedException e) {
            // swallow and return null; caller will handle
        }
        return null;
    }
}
