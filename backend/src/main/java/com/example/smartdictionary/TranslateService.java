package com.example.smartdictionary;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;

/**
 * Simple EN->VI translation using MyMemory Translation API.
 * Free, no API key required for reasonable usage.
 * API: https://mymemory.translated.net/doc/spec.php
 */
public class TranslateService {

    private final HttpClient client = HttpClient.newBuilder()
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();
    private final String apiUrl = "https://api.mymemory.translated.net/get";
    private String lastError;

    public TranslateService() {
        System.out.println("[TranslateService] Using MyMemory API: " + apiUrl);
    }

    public String translateEnToVi(String text) {
        if (text == null || text.isBlank()) return null;

        try {
            String encoded = URLEncoder.encode(text, StandardCharsets.UTF_8);
            String langpair = URLEncoder.encode("en|vi", StandardCharsets.UTF_8);
            String url = apiUrl + "?q=" + encoded + "&langpair=" + langpair;
            
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                lastError = "HTTP " + response.statusCode();
                System.err.println("[TranslateService] Non-200: " + lastError);
                return null;
            }

            JsonNode root = mapper.readTree(response.body());
            JsonNode responseData = root.get("responseData");
            if (responseData == null) {
                lastError = "No responseData in API response";
                System.err.println("[TranslateService] Parse error: " + lastError);
                return null;
            }

            JsonNode translated = responseData.get("translatedText");
            if (translated == null || translated.isNull()) {
                lastError = "No translatedText field";
                System.err.println("[TranslateService] Parse error: " + lastError);
                return null;
            }

            lastError = null;
            String result = translated.asText();
            System.out.println("[TranslateService] Success: " + text + " → " + result);
            return result;
        } catch (Exception e) {
            lastError = e.getMessage();
            System.err.println("[TranslateService] Exception: " + lastError);
            e.printStackTrace();
            return null;

        }
    }

    public String getLastError() {
        return lastError;
    }
}
