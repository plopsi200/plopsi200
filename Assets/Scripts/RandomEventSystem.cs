using UnityEngine;
using UnityEngine.UI;
using System.Collections;

public class RandomEventSystem : MonoBehaviour
{
    [Header("Golden Button")]
    public Button goldenButton;
    public float goldenButtonDuration = 3f;
    public float minEventInterval = 30f;
    public float maxEventInterval = 120f;

    [Header("Glitch Effect")]
    public GameObject glitchOverlay;
    public float glitchDuration = 5f;
    public float glitchMultiplier = 2f;

    private void Start()
    {
        goldenButton.gameObject.SetActive(false);
        if (glitchOverlay != null) glitchOverlay.SetActive(false);

        StartCoroutine(EventSpawner());
    }

    IEnumerator EventSpawner()
    {
        while (true)
        {
            yield return new WaitForSeconds(Random.Range(minEventInterval, maxEventInterval));

            int eventType = Random.Range(0, 2);
            if (eventType == 0)
                StartCoroutine(SpawnGoldenButton());
            else
                StartCoroutine(TriggerGlitch());
        }
    }

    IEnumerator SpawnGoldenButton()
    {
        // Random position on screen (simple implementation)
        RectTransform rt = goldenButton.GetComponent<RectTransform>();
        rt.anchoredPosition = new Vector2(Random.Range(-300, 300), Random.Range(-300, 300));

        goldenButton.gameObject.SetActive(true);
        goldenButton.onClick.AddListener(OnGoldenButtonClick);

        yield return new WaitForSeconds(goldenButtonDuration);

        goldenButton.onClick.RemoveListener(OnGoldenButtonClick);
        goldenButton.gameObject.SetActive(false);
    }

    void OnGoldenButtonClick()
    {
        GameManager.Instance.AddPoints(GameManager.Instance.pointsPerClick * 100);
        goldenButton.gameObject.SetActive(false);
        Debug.Log("GOLDEN BUTTON CLICKED!");
    }

    IEnumerator TriggerGlitch()
    {
        if (glitchOverlay != null) glitchOverlay.SetActive(true);
        GameManager.Instance.eventMultiplier *= glitchMultiplier;

        yield return new WaitForSeconds(glitchDuration);

        GameManager.Instance.eventMultiplier /= glitchMultiplier;
        if (glitchOverlay != null) glitchOverlay.SetActive(false);
        Debug.Log("Glitch Ended");
    }
}
