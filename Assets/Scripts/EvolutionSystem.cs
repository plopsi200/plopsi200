using UnityEngine;
using TMPro;

public class EvolutionSystem : MonoBehaviour
{
    [System.Serializable]
    public class EvolutionStage
    {
        public string stageName;
        public double pointThreshold;
        public float multiplier;
        public GameObject visualObject;
    }

    public EvolutionStage[] stages;
    public TextMeshProUGUI stageIndicator;

    private int currentStageIndex = -1;

    private void Start()
    {
        GameManager.Instance.OnPointsChanged += CheckEvolution;
        CheckEvolution(GameManager.Instance.points);
    }

    private void OnDestroy()
    {
        if (GameManager.Instance != null)
        {
            GameManager.Instance.OnPointsChanged -= CheckEvolution;
        }
    }

    private void CheckEvolution(double currentPoints)
    {
        for (int i = stages.Length - 1; i >= 0; i--)
        {
            if (currentPoints >= stages[i].pointThreshold)
            {
                if (currentStageIndex != i)
                {
                    TransitionToStage(i);
                }
                break;
            }
        }
    }

    private void TransitionToStage(int index)
    {
        currentStageIndex = index;

        // Update Multiplier
        GameManager.Instance.baseMultiplier = stages[index].multiplier;

        // Update Visuals
        for (int i = 0; i < stages.Length; i++)
        {
            if (stages[i].visualObject != null)
                stages[i].visualObject.SetActive(i == index);
        }

        if (stageIndicator != null)
            stageIndicator.text = "Stage: " + stages[index].stageName;

        Debug.Log("Evolved to: " + stages[index].stageName);
    }
}
