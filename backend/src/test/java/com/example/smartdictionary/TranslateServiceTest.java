package com.example.smartdictionary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;

import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TranslateServiceTest {

    @Mock
    private HttpClient httpClient;

    @Mock
    private HttpResponse<String> httpResponse;

    private TranslateService translateService;

    @BeforeEach
    void setUp() {
        translateService = new TranslateService(httpClient);
    }

    @Test
    void translateEnToVi_returnsTranslation_onSuccessResponse() throws Exception {
        Mockito.when(httpResponse.statusCode()).thenReturn(200);
        Mockito.when(httpResponse.body()).thenReturn("{\"translatedText\":\"xin chào\"}");
        Mockito.when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
               .thenReturn(httpResponse);

        String result = translateService.translateEnToVi("hello");

        assertEquals("xin chào", result);
    }

    @Test
    void translateEnToVi_returnsNull_onNon2xxResponse() throws Exception {
        Mockito.when(httpResponse.statusCode()).thenReturn(500);
        Mockito.when(httpClient.send(any(HttpRequest.class), any(HttpResponse.BodyHandler.class)))
               .thenReturn(httpResponse);

        String result = translateService.translateEnToVi("hello");

        assertNull(result);
    }
}
