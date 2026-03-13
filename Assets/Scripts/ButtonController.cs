using UnityEngine;
using UnityEngine.UI;
using UnityEngine.EventSystems;
using System.Collections;

public class ButtonController : MonoBehaviour, IPointerDownHandler, IPointerUpHandler
{
    [Header("Visual Settings")]
    [SerializeField] private RectTransform buttonTransform;
    [SerializeField] private float clickScale = 0.9f;
    [SerializeField] private float scaleSpeed = 10f;

    [Header("Effects")]
    [SerializeField] private ParticleSystem clickParticles;
    [SerializeField] private AudioSource clickAudio;

    private Vector3 originalScale;
    private bool isPressed = false;

    private void Start()
    {
        if (buttonTransform == null) buttonTransform = GetComponent<RectTransform>();
        originalScale = buttonTransform.localScale;
    }

    public void OnPointerDown(PointerEventData eventData)
    {
        isPressed = true;
        HandleClick();
    }

    public void OnPointerUp(PointerEventData eventData)
    {
        isPressed = false;
    }

    private void Update()
    {
        Vector3 targetScale = isPressed ? originalScale * clickScale : originalScale;
        buttonTransform.localScale = Vector3.Lerp(buttonTransform.localScale, targetScale, Time.deltaTime * scaleSpeed);
    }

    private void HandleClick()
    {
        GameManager.Instance.PerformClick();

        if (clickParticles != null) clickParticles.Play();
        if (clickAudio != null) clickAudio.Play();
    }
}
