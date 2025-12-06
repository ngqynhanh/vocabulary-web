package com.example.smartdictionary;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Simple EN->VI translation via LibreTranslate public endpoint.
 * Endpoint: https://libretranslate.de/translate
 * No API key required for basic usage. Consider hosting your own instance for production use.
 */
public class TranslateService {

    private static final String TRANSLATE_URL = "https://libretranslate.de/translate";
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    public String translateEnToVi(String text) {
        if (text == null || text.isBlank()) return null;
        String payload = String.format("{\"q\":%s,\"source\":\"en\",\"target\":\"vi\",\"format\":\"text\"}",
                mapper.valueToTree(text).toString());

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(TRANSLATE_URL))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                JsonNode node = mapper.readTree(response.body());
                if (node.has("translatedText")) {
                    return node.get("translatedText").asText();
                }
            }
        } catch (IOException | InterruptedException e) {
            // ignore and return null
        }
        return null;
    }
}
