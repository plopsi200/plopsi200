using UnityEngine;
using UnityEngine.UI;
using TMPro;
using System.Collections.Generic;

public class UpgradeManager : MonoBehaviour
{
    [System.Serializable]
    public class UpgradeData
    {
        public Upgrade upgradeInfo;
        public int currentLevel = 0;
        public TextMeshProUGUI levelText;
        public TextMeshProUGUI costText;
        public Button purchaseButton;
    }

    public List<UpgradeData> upgrades = new List<UpgradeData>();

    private void Start()
    {
        foreach (var data in upgrades)
        {
            data.purchaseButton.onClick.AddListener(() => PurchaseUpgrade(data));
            UpdateUI(data);
        }
    }

    public void PurchaseUpgrade(UpgradeData data)
    {
        double cost = data.upgradeInfo.GetCost(data.currentLevel);
        if (GameManager.Instance.TrySpendPoints(cost))
        {
            data.currentLevel++;
            ApplyUpgradeEffect(data.upgradeInfo);
            UpdateUI(data);
        }
    }

    private void ApplyUpgradeEffect(Upgrade upgrade)
    {
        switch (upgrade.type)
        {
            case Upgrade.UpgradeType.PointsPerClick:
                GameManager.Instance.pointsPerClick += upgrade.effectValue;
                break;
            case Upgrade.UpgradeType.AutoClickRate:
                GameManager.Instance.autoClickRate += upgrade.effectValue;
                break;
            case Upgrade.UpgradeType.ChanceX10:
                GameManager.Instance.criticalClickChance += upgrade.effectValue;
                break;
        }
    }

    public void RefreshAllUI()
    {
        foreach (var data in upgrades)
        {
            UpdateUI(data);
        }
    }

    private void UpdateUI(UpgradeData data)
    {
        data.levelText.text = "Lvl " + data.currentLevel;
        data.costText.text = data.upgradeInfo.GetCost(data.currentLevel).ToString("F0");
    }
}
