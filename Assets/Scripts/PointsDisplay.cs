using UnityEngine;
using TMPro;

public class PointsDisplay : MonoBehaviour
{
    public TextMeshProUGUI pointsText;
    public TextMeshProUGUI pointsPerClickText;
    public TextMeshProUGUI autoClickRateText;

    private void Start()
    {
        GameManager.Instance.OnPointsChanged += UpdateDisplay;
        UpdateDisplay(GameManager.Instance.points);
    }

    private void OnDestroy()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnPointsChanged -= UpdateDisplay;
        }
    }

    private void Update()
    {
        // For stats that change via upgrades, we can update them here or via events
        if (pointsPerClickText != null)
            pointsPerClickText.text = "Click Power: " + GameManager.Instance.pointsPerClick.ToString("F1");

        if (autoClickRateText != null)
            autoClickRateText.text = "Auto Click: " + GameManager.Instance.autoClickRate.ToString("F1") + "/s";
    }

    private void UpdateDisplay(double points)
    {
        if (pointsText != null)
            pointsText.text = points.ToString("F0");
    }
}
